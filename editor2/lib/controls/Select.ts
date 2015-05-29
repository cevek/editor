module control {
    export class SelectOptGroup<T> {
        constructor(public text:string, public children:SelectOption<T>[], public disabled?:boolean) {}
    }
    export class SelectOption<T> {
        constructor(public text:string, public value:T, public disabled?:boolean) {}
    }

    export class SelectBase<T> extends virtual.Component<{
        data:(SelectOption<T> | SelectOptGroup<T>)[];
        values:T[];
        emptyLabel?:string;
        onChange?:(val:T)=>void;
        onChangeMultiple?:(val:T[])=>void}> {

        options:virtual.VNode[] = [];
        optionValues:SelectOption<T>[] = [];

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

            this.props.onChange && this.props.onChange(model);
            this.props.onChangeMultiple && this.props.onChangeMultiple(modelMultiple);
        }

        option(opt:SelectOption<T>) {
            var option = vd('option', {
                selected: this.props.values.indexOf(opt.value) > -1,
                disabled: opt.disabled
            }, opt.text);
            this.options.push(option);
            this.optionValues.push(opt);
            return option;
        }

        componentDidMount() {
            //workaround
            if (this.attrs['required'] && this.attrs['multiple'] && this.props.values.length == 0) {
                (<HTMLSelectElement>this.rootNode.dom).selectedIndex = -1;
            }
        }

        render() {
            return vd('select', virtual.extend({oninput: ()=>this.change()}, this.attrs),
                this.props.emptyLabel ?
                    vd('option', {
                        value: '',
                        disabled: this.attrs['required'],
                        selected: (!this.attrs['required'] || !this.attrs['multiple']) && this.props.values.length == 0
                    }, this.props.emptyLabel) : null,
                this.props.data.map(item=> {
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

}