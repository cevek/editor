///<reference path="Popup.ts"/>
///<reference path="DatePicker.ts"/>
///<reference path="Select.ts"/>
///<reference path="Tab.ts"/>
///<reference path="AutoComplete.ts"/>
module control {

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
                        type: 'button',
                        classes: {active: m == this.active},
                        onclick: ()=>this.active = m
                    }, this.label(m)))
            );
        }
    }

    export class Button extends virtual.Component {
        constructor(public text:string, public onClick:()=>void) {
            super();
        }

        render() {
            return vd('button', virtual.extend({type: 'button', onclick: this.onClick}, this.attrs), this.text);
        }
    }
}