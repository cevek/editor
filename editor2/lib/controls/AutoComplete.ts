module control {
    export class AutoComplete<T> extends virtual.Component {
        input:virtual.VNode;
        inputNode:HTMLInputElement;
        @observe opened = false;
        @observe value = '';
        @observe active = 0;
        filtered:T[];

        constructor(public items:T[],
                    public title:(item:T)=>string,
                    value = '',
                    public filter?:(item:T, text:string)=>boolean,
                    public template?:(item:T, text:string)=>virtual.VNode,
                    public onSelect?:(item:T, text:string)=>void) {
            super();
            this.value = value;
            this.filter = this.filter || this.defaultFilter;
            this.template = this.template || this.defaultTemplate;
        }

        defaultFilter(item:T, find:string) {
            return this.title(item).indexOf(find) > -1;
        }

        defaultTemplate(item:T, find:string) {
            var text = this.title(item);
            var pos = text.indexOf(find);
            if (pos > -1 && find.length > 0) {
                return vd('div',
                    text.substring(0, pos),
                    vd('b', text.substring(pos, pos + find.length)),
                    text.substring(pos + find.length)
                );
            }
            return vd('div', text);
        }

        doFilter() {
            return this.filtered = this.items.filter(item => this.filter(item, this.value));
        }

        setActiveNodeValue() {
            this.inputNode.value = this.title(this.filtered[this.active]);
        }

        select(item:T) {
            this.value = this.title(item);
            this.inputNode.value = this.value;
            this.opened = false;
            this.onSelect && this.onSelect(item, this.value);
        }

        open() {
            this.opened = true;
            this.active = 0;
        }

        close() {
            this.opened = false;
            this.inputNode.value = this.value;
        }

        keydown(e:KeyboardEvent) {
            var key = new KeyboardKey(e);
            if (key.noMod && this.opened) {
                var last = this.filtered.length - 1;
                if (key.up) {
                    this.active = this.active == 0 ? last : this.active - 1;
                    this.setActiveNodeValue();
                    e.preventDefault();
                }
                if (key.down) {
                    this.active = this.active >= last ? 0 : this.active + 1;
                    this.setActiveNodeValue();
                    e.preventDefault();
                }
                if (key.enter) {
                    this.select(this.filtered[this.active]);
                    e.preventDefault();
                }
                if (key.escape) {
                    this.close();
                }
            }
        }

        componentDidMount() {
            this.inputNode = <HTMLInputElement>this.input.dom;
        }

        render() {
            return this.root(
                this.input = vd('input', {
                    type: 'text',
                    value: this.value,
                    onkeydown: (e:KeyboardEvent)=>this.keydown(e),
                    onfocus: ()=>this.open(),
                    oninput: ()=>this.value = (<HTMLInputElement>this.input.dom).value
                }),
                this.opened ?
                    new Tip(this.input, [this.input], ()=>this.close()).init(
                        vd('.items', this.doFilter().map((item, i)=>
                            vd('.item', {
                                    classes: {active: i == this.active},
                                    onclick: ()=>this.select(item)
                                },
                                this.template(item, this.value))))
                    ) : null
            );
        }
    }
}