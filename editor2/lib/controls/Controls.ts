///<reference path="Popup.ts"/>
///<reference path="DatePicker.ts"/>
module control {

    export class SelectOptGroup<T> {
        constructor(public text:string, public children:SelectOption<T>[], public disabled?:boolean) {}
    }
    export class SelectOption<T> {
        constructor(public text:string, public value:T, public disabled?:boolean) {}
    }

    export class Select<T> extends virtual.Component {
        options:virtual.VNode[] = [];
        optionValues:T[] = [];
        values:T[];

        constructor(public data:(SelectOption<T> | SelectOptGroup<T>)[],
                    value:T | T[],
                    public onChange?:(val:T)=>void,
                    public onChangeMultiple?:(val:T[])=>void) {
            super();
            this.values = value instanceof Array ? value : [<T>value];
        }

        change() {
            var modelMultiple:T[] = [];
            var model:T = null;
            var setSelected = false;
            this.options.forEach((opt, i)=> {
                var isSelected = (<HTMLOptionElement>opt.dom).selected;
                if (isSelected) {
                    if (!setSelected) {
                        model = this.optionValues[i];
                        setSelected = true;
                    }
                    modelMultiple.push(this.optionValues[i]);
                }
            });
            this.onChange && this.onChange(model);
            this.onChangeMultiple && this.onChangeMultiple(modelMultiple);
        }

        option(opt:SelectOption<T>) {
            var option = vd('option', {
                selected: this.values.indexOf(opt.value) > -1,
                disabled: opt.disabled
            }, opt.text);
            this.options.push(option);
            this.optionValues.push(opt.value);
            return option;
        }

        componentDidMount() {
            this.change();
        }

        render() {
            return vd('select', virtual.extend({oninput: ()=>this.change()}, this.attrs),
                this.data.map(item=> {
                    if (item instanceof SelectOptGroup) {
                        return vd('optgroup', {label: item.text, disabled: item.disabled},
                            item.children.map(opt => this.option(opt))
                        );
                    }
                    if (item instanceof SelectOption) {
                        return this.option(item);
                    }
                })
            );
        }
    }

    export class InputGroup extends virtual.Component {
        constructor(public label:string, public labelRight = false) {
            super();
        }

        render() {
            var label = vd('span.label', this.label);
            return this.root(
                this.labelRight
                    ? vd('label', this.children, label)
                    : vd('label', label, ":", this.children)
            );
        }
    }

    export class Checkbox extends virtual.Component {
        constructor(public checked = false, public onChange?:(val:boolean)=>void) {
            super();
        }

        change() {
            var checked = (<HTMLInputElement>this.rootNode.dom).checked;
            this.onChange && this.onChange(checked);
        }

        render() {
            return vd('input', {type: 'checkbox', checked: this.checked, oninput: ()=>this.change()});
        }
    }

    export class RadioItem<T> {
        constructor(public label:string, public value:T, public disabled?:boolean) {}
    }

    export class RadioGroup<T> extends virtual.Component {
        name = Math.random().toString(33).substr(2, 3);

        constructor(public items:RadioItem<T>[],
                    public value?:T,
                    public onChange?:(val:T)=>void) {
            super();
        }

        change(item:RadioItem<T>) {
            this.onChange && this.onChange(item.value);
        }

        render() {
            return this.rootWithAttrs({class: 'radio-buttons'},
                this.items.map(item =>
                        new InputGroup(item.label, true).init(
                            vd('input', {
                                type: 'radio',
                                name: this.name,
                                checked: this.value === item.value,
                                disabled: item.disabled,
                                oninput: ()=>this.change(item)
                            })
                        )
                )
            );
        }
    }

    export class RadioButtons<T> extends virtual.Component {
        @observe active:T;

        constructor(public items:T[], public label:(model:T)=>string, public value?:observer.Atom<T>) {
            super();
            if (this.value) {
                observer.Atom.from(this.active).sync(this.value);
            }
        }

        render() {
            return this.rootWithAttrs({class: 'radio-buttons'},
                this.items.map(m =>
                    vd('button', {
                        classes: {active: m == this.active},
                        events: {click: ()=>this.active = m}
                    }, this.label(m)))
            );
        }
    }

    export class Tabs extends virtual.Component {
        @observe active:Object = null;
        titles:string[] = [];
        values:Object[] = [];
        content:virtual.Child;

        constructor(public value?:observer.Atom<Object>) {
            super();
        }

        componentWillMount() {
            if (this.value) {
                observer.Atom.from(this.active).sync(this.value);
            }
        }

        getChildrenTabs() {
            this.titles = [];
            this.values = [];
            var firstTab:Tab = null;
            this.children.forEach(child => {
                if (child instanceof virtual.VNode && child.component instanceof Tab) {
                    var tab = <Tab>child.component;
                    this.titles.push(tab.title);
                    this.values.push(tab.value);
                    if (this.active == null && tab.isDefault) {
                        this.active = tab.value;
                    }
                    if (tab.value == this.active) {
                        this.content = tab.rootNode;
                    }
                    if (!firstTab) {
                        firstTab = tab;
                    }
                }
            });
            if (this.active == null && firstTab) {
                this.active = this.values[0];
                this.content = firstTab.rootNode;
            }
        }

        render() {
            this.getChildrenTabs();
            return this.root(
                this.titles.map((m, i) =>
                        vd('button', {
                            classes: {active: this.values[i] == this.active},
                            events: {click: ()=>this.active = this.values[i]}
                        }, m)
                ),
                this.content
            )
        }
    }

    export class Tab extends virtual.Component {
        constructor(public title:string, public value:any = {}, public isDefault?:boolean) {
            super();
        }

        render() {
            return this.root(this.children);
        }
    }
}