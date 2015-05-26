module control{
    export class AutoComplete<T> extends virtual.Component {
        input:virtual.VNode;
        @observe focused = false;
        @observe value = '';
        @observe filtered:T[];

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
            if (pos > -1) {
                return vd('div',
                    text.substring(0, pos),
                    vd('b', text.substring(pos, pos + find.length)),
                    text.substring(pos + find.length)
                );
            }
            return vd('div', text);
        }

        doFilter() {
            return this.items.filter(item => this.filter(item, this.value));
        }

        click(item:T) {
            var node = <HTMLInputElement>this.input.dom;
            this.value = this.title(item);
            node.value = this.value;
            this.focused = false;
            this.onSelect && this.onSelect(item, this.value);
        }

        componentDidMount() {

        }

        render() {
            return this.root(
                this.input = vd('input', {
                    type: 'text',
                    value: this.value,
                    onfocus: ()=>this.focused = true,
                    oninput: ()=>this.value = (<HTMLInputElement>this.input.dom).value
                }),
                this.focused ?
                    new Tip(this.input, [this.input], ()=>this.focused = false).init(
                        vd('.items', this.doFilter().map((item)=>
                            vd('.item', {onclick: ()=>this.click(item)},
                                this.template(item, this.value))))
                    ) : null
            );
        }
    }
}