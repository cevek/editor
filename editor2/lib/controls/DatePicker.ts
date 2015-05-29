module control {
    export class DatePicker extends virtual.Component<{value?:Date; onChange?:(val:Date)=>void}> {
        @observe model:Date;
        @observe focused = false;
        input:virtual.VNode;
        button:virtual.VNode;

        updateAttrs(){
            this.model = this.props.value;
            observer.Atom.from(this.model).setListener(new observer.Listener(this.props.onChange));
            this.watch(this.modelChanged);
        }

        parser() {
            var node = <HTMLInputElement>this.input.dom;
            var value = node.value.trim().replace(/[^\d]+/g, '/');
            value = value.replace(/^(\d{1,2})\/(\d{1,2})\//, '$2/$1/');
            var has3DigitBlocks = value.match(/(\d{1,4})\/(\d{1,2})\/(\d{1,4})/);
            //var year4Digit = has3DigitBlocks && (has3DigitBlocks[1].length == 2 || has3DigitBlocks[1].length == 4);
            var date = new Date(value);
            if (value.length > 5 && has3DigitBlocks && isFinite(date.getTime()) && date.getFullYear() >= 1000 && date.getFullYear() < 3000) {
                this.model = date;
            }
            else {
                this.model = new Date("invalid");
            }
        }

        formatter(setEmptyIfInvalid = false) {
            var node = <HTMLInputElement>this.input.dom;
            var val = this.model;
            if (val && isFinite(val.getTime())) {
                node.value = ('0' + val.getDate()).substr(-2) + '/' + ('0' + (val.getMonth() + 1)).substr(-2) + '/' + val.getFullYear();
            }
            else if (setEmptyIfInvalid) {
                node.value = '';
            }
        }

        openCalendar() {
            this.focused = true;
        }

        modelChanged(isBlurEvent = false) {
            console.log("model changed", this.model);
            if (this.input && this.input.dom) {
                var node = <HTMLInputElement>this.input.dom;
                if (this.model) {
                    if (isFinite(this.model.getTime())) {
                        node.setCustomValidity('');
                    }
                    else {
                        node.setCustomValidity('Invalid date');
                    }
                }
                else {
                    node.setCustomValidity('');
                }

                if (node !== document.activeElement) {
                    this.formatter(!isBlurEvent);
                }
            }
        }

        render() {
            return this.root(
                vd('div', this.model && this.model.getTime() && this.model.toJSON()),
                vd('br'),
                this.input = vd('input', {
                    type: 'text',
                    required: true,
                    oninput: ()=>this.parser(),
                    onfocus: ()=>this.openCalendar(),
                    onblur: ()=>this.modelChanged(true)
                }),

                this.button = vd('button', {events: {click: ()=>this.openCalendar()}}, '*'),
                this.focused ?
                    new Tip().init({
                            target: this.input,
                            notCloseOnClick: [this.input, this.button],
                            onClose: ()=>this.focused = false
                        }, null,
                        new DatePickerCalendar().init({value: this.model, onChange: (val)=>this.model = val})
                    ) : null
            );
        }
    }

    export class DatePickerCalendar extends virtual.Component<{value?:Date; onChange?:(val:Date)=>void}> {
        @observe model:Date;

        static months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        static weeks = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        static weekOrder = [1, 2, 3, 4, 5, 6, 0];

        private currentDay = DatePickerCalendar.getDayInt(new Date());

        @observe private firstDayOfMonth:Date;
        private days:Date[][] = [];

        constructor(value?:Date, onChange?:(val:Date)=>void) {
            super();
            this.model = value;
            observer.Atom.from(this.model).setListener(new observer.Listener(onChange));
            this.watch(this.modelChanged);
        }

        static getDayInt(date:Date) {
            return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        }

        static getMonday(dt:Date) {
            var date = new Date(dt.getTime());
            var weekDay = date.getDay();
            var diff = date.getDate() - weekDay + (weekDay == 0 ? -6 : 1);
            return new Date(date.setDate(diff));
        }

        calcDays() {
            this.days = [];
            var start = DatePickerCalendar.getMonday(this.firstDayOfMonth);
            for (var j = 0; j < 42; j++) {
                var week = j / 7 | 0;
                if (!this.days[week]) {
                    this.days[week] = [];
                }
                this.days[week].push(new Date(start.getTime() + j * (24 * 60 * 60 * 1000)));
            }
        }

        modelChanged() {
            var dt = this.model;
            if (dt && isFinite(dt.getTime())) {
                var dd = new Date(dt.getFullYear(), dt.getMonth(), 1);
            }
            else {
                dd = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
            this.firstDayOfMonth = dd;
        }

        move(pos:number) {
            var dt = this.firstDayOfMonth;
            var nDt = new Date(dt.getTime());
            if (pos === 1 || pos === -1) {
                nDt.setMonth(dt.getMonth() + pos);
            }
            if (pos === 0) {
                nDt = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            }
            this.firstDayOfMonth = nDt;
        }

        render() {
            this.calcDays();
            return this.root(
                vd('.header',
                    vd('.month-year',
                        DatePickerCalendar.months[this.firstDayOfMonth.getMonth()],
                        ' ',
                        this.firstDayOfMonth.getFullYear()),

                    vd('.controls',
                        vd('a.left', {events: {click: ()=>this.move(-1)}}, '<'),
                        vd('a.current', {events: {click: ()=>this.move(0)}}, '.'),
                        vd('a.right', {events: {click: ()=>this.move(1)}}, '>'))
                ),
                vd('div.week-names',
                    DatePickerCalendar.weekOrder.map(p=>
                        vd('.day.week-name', DatePickerCalendar.weeks[p]))),

                this.days.map(week=>
                    vd('.week',
                        week.map(day=>
                            vd('.day', {
                                    classes: {
                                        'current': this.currentDay === DatePickerCalendar.getDayInt(day),
                                        'current-month': this.firstDayOfMonth.getMonth() === day.getMonth(),
                                        'active': this.model && DatePickerCalendar.getDayInt(this.model) == DatePickerCalendar.getDayInt(day)
                                    },
                                    events: {click: ()=>this.model = day}
                                },
                                day.getDate()))))
            );
        }
    }
}

new control.DatePicker().init({}).mount(document.body);
//new control.DatePickerCalendar().init().mount(document.body);