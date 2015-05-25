module control {
    export class SelectOptGroup<T> {
        constructor(public text:string, public children:SelectOption<T>[], public disabled?:boolean) {}
    }
    export class SelectOption<T> {
        constructor(public text:string, public value:T, public disabled?:boolean) {}
    }

    class SelectBase<T> extends virtual.Component {
        options:virtual.VNode[] = [];
        optionValues:SelectOption<T>[] = [];

        constructor(public data:(SelectOption<T> | SelectOptGroup<T>)[],
                    public values:T[],
                    public emptyLabel?:string,
                    public onChange?:(val:T)=>void,
                    public onChangeMultiple?:(val:T[])=>void,
                    public isMultiple = false) {
            super();
        }

        change() {
            var modelMultiple:T[] = [];
            var model:T = null;
            var setSelected = false;
            this.options.forEach((opt, i)=> {
                var isSelected = (<HTMLOptionElement>opt.dom).selected;
                var optVal = this.optionValues[i];
                if (isSelected) {
                    if (!setSelected) {
                        model = optVal.value;
                        setSelected = true;
                    }
                    modelMultiple.push(optVal.value);
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
            this.optionValues.push(opt);
            return option;
        }

        componentDidMount() {
            //workaround
            if (this.attrs['required'] && this.isMultiple && this.values.length == 0) {
                (<HTMLSelectElement>this.rootNode.dom).selectedIndex = -1;
            }
        }

        render() {
            return vd('select', virtual.extend({multiple: this.isMultiple, oninput: ()=>this.change()}, this.attrs),
                this.emptyLabel ?
                    vd('option', {
                        value: '',
                        disabled: this.attrs['required'],
                        selected: (!this.attrs['required'] || !this.isMultiple) && this.values.length == 0
                    }, this.emptyLabel) : null,
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

    export class Select<T> extends SelectBase<T> {
        constructor(data:(SelectOption<T> | SelectOptGroup<T>)[],
                    value?:T,
                    emptyLabel?:string,
                    onChange?:(val:T)=>void) {
            super(data, value == null ? [] : [value], emptyLabel, onChange);
        }
    }
    export class SelectMultiple<T> extends SelectBase<T> {
        constructor(data:(SelectOption<T> | SelectOptGroup<T>)[],
                    values?:T[],
                    emptyLabel?:string,
                    onChange?:(val:T[])=>void) {
            super(data, values, emptyLabel, null, onChange, true);
        }
    }
}