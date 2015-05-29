///<reference path="Popup.ts"/>
///<reference path="DatePicker.ts"/>
///<reference path="Select.ts"/>
///<reference path="Tab.ts"/>
///<reference path="AutoComplete.ts"/>
module control {

    export class InputGroup extends virtual.Component<{label:string; labelRight?: boolean}> {
        render() {
            var label = vd('span.label', this.props.label);
            return this.root(
                this.props.labelRight
                    ? vd('label', this.children, label)
                    : vd('label', label, ":", this.children)
            );
        }
    }

    export class Checkbox extends virtual.Component<{checked:boolean; onChange?:(val:boolean)=>void}> {
        change() {
            var checked = (<HTMLInputElement>this.rootNode.dom).checked;
            this.props.onChange && this.props.onChange(checked);
        }

        render() {
            return vd('input', {type: 'checkbox', checked: this.props.checked, oninput: ()=>this.change()});
        }
    }

    export class RadioItem<T> {
        constructor(public label:string, public value:T, public disabled?:boolean) {}
    }

    export class RadioGroup<T> extends virtual.Component<{items:RadioItem<T>[];value?:T;onChange?:(val:T)=>void}> {
        name = Math.random().toString(33).substr(2, 3);

        change(item:RadioItem<T>) {
            this.props.onChange && this.props.onChange(item.value);
        }

        render() {
            return this.rootWithAttrs({class: 'radio-buttons'},
                this.props.items.map(item =>
                        new InputGroup().init({label: item.label, labelRight: true}, null,
                            vd('input', {
                                type: 'radio',
                                name: this.name,
                                checked: this.props.value === item.value,
                                disabled: item.disabled,
                                oninput: ()=>this.change(item)
                            })
                        )
                )
            );
        }
    }

    export class RadioButtons<T> extends virtual.Component<{items:T[]; label:(model:T)=>string; value?:observer.Atom<T>}> {
        @observe active:T;

        render() {
            return this.rootWithAttrs({class: 'radio-buttons'},
                this.props.items.map(m =>
                    vd('button', {
                        type: 'button',
                        classes: {active: m == this.active},
                        onclick: ()=>this.active = m
                    }, this.props.label(m)))
            );
        }
    }

    export class Button extends virtual.Component<{ text:string; onClick:()=>void}> {

        render() {
            return vd('button', virtual.extend({
                type: 'button',
                onclick: this.props.onClick
            }, this.attrs), this.props.text);
        }
    }
}