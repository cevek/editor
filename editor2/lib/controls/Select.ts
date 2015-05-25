module control{
    export class SelectOptGroup<T> {
        constructor(public text:string, public children:SelectOption<T>[], public disabled?:boolean) {}
    }
    export class SelectOption<T> {
        constructor(public text:string, public value:T, public disabled?:boolean, public emptyValue?:boolean) {}
    }

    class SelectBase<T> extends virtual.Component {
        options:virtual.VNode[] = [];
        optionValues:SelectOption<T>[] = [];

        constructor(public data:(SelectOption<T> | SelectOptGroup<T>)[],
                    public values:T[],
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
                if (isSelected && !optVal.emptyValue) {
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
            if (opt.emptyValue) {
                var isSelected = this.values.length == 0;
            }
            else {
                isSelected = this.values.indexOf(opt.value) > -1;
            }
            var option = vd('option', {
                selected: isSelected,
                value: opt.disabled && opt.emptyValue ? '' : void 0,
                disabled: opt.disabled
            }, opt.text);
            this.options.push(option);
            this.optionValues.push(opt);
            return option;
        }

        render() {
            return vd('select', virtual.extend({multiple: this.isMultiple, oninput: ()=>this.change()}, this.attrs),
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
                    onChange?:(val:T)=>void) {
            super(data, value ? [value] : [], onChange);
        }
    }
    export class SelectMultiple<T> extends SelectBase<T> {
        constructor(data:(SelectOption<T> | SelectOptGroup<T>)[],
                    values?:T[],
                    onChange?:(val:T[])=>void) {
            super(data, values, null, onChange, true);
        }
    }
}