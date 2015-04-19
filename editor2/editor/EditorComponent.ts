///<reference path="config.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="Events.ts"/>
///<reference path="PathComponent.ts"/>
///<reference path="AudioPlayer.ts"/>
///<reference path="AudioSelection.ts"/>
///<reference path="AudioSelectionComponent.ts"/>
///<reference path="KeyManager.ts"/>
///<reference path="TextController.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Model.ts"/>
///<reference path="Toolbar.ts"/>

module editor {
    export class EditorComponent extends React.Component<any,any> {
        el:HTMLElement;
        offsetTop = 0;

        audioHeight = 30000 / (50 * config.lineDuration / config.lineHeight);

        model = new Model;
        //eventEmitter = new EventEmitter<Action>();
        events = new Events;
        toolbar = new Toolbar(this.model, this.events);
        keyManager = new KeyManager(this.events);
        historyService = new HistoryService();
        textEditor = new TextController(
            this.model,
            this.events,
            this.historyService,
            null,
            ()=>this.forceUpdate());

        constructor() {
            super(null, null);
            glob.editor = this;
            this.events.undo.listen(()=>this.undo());
            this.events.redo.listen(()=>this.redo());
        }

        undo() {
            var change = this.historyService.back();
            if (change) {
                linesStore.undo(change);
                this.textEditor.undo(change);
                this.forceUpdate();
            }
        }

        redo() {
            var change = this.historyService.forward();
            if (change) {
                linesStore.redo(change);
                this.textEditor.redo(change);
                this.forceUpdate();
            }
        }

        getThumbPos(time:number) {
            //var time = this.fromVisibleToTime(i);
            var width = 100; //243
            var height = config.lineHeight;//100;
            var rounded = 0;//i % 2 * 50;
            //i = (i / 2 | 0) * 2;
            return `${(-time % 20) * width}px ${(-time / 20 | 0) * height - rounded}px`;
        }

        componentDidUpdate() {
            this.textEditor.updateCursor();
        }

        componentDidMount() {
            this.el = <HTMLElement>React.findDOMNode(this);
            this.offsetTop = this.el.offsetTop;
            document.addEventListener("keydown", e => {
                var key = new KeyboardKey(e);
                if (this.keyManager.keyManager(key)) {
                    e.preventDefault();
                }
            });

            this.el.addEventListener('click', e => this.events.mouseClick.emit(e));
            this.el.addEventListener('mousedown', e => this.events.mouseDown.emit(e));

            this.textEditor.el = this.el;
            this.textEditor.updateCursor();
        }

        render() {
            this.model.prepareData(linesStore);
            this.model.prepareHideLines();

            return div({className: 'editor'},
                div({className: 'panel'},
                    React.DOM.button({onClick: ()=>this.toolbar.hideEmptyLines()}, 'Hide')
                ),
                React.createElement(AudioSelectionComponent, {
                    model: this.model,
                    events: this.events
                }),
                this.model.lines.map(
                    (line, i) =>
                        div({
                                className: cx({
                                    line: true,
                                    hidden: line.hidden,
                                    linked: line.model.linked
                                }),
                                'data-line': i,
                                'data-may-hide': line.mayHide ? line.mayHide : void 0,
                                'data-collapsed': line.collapsed ? line.collapsed : void 0,
                                'data-collapsible-count': line.collapsibleCount ? line.collapsibleCount : void 0
                            },
                            div({
                                className: 'thumb',
                                style: {backgroundPosition: this.getThumbPos(i)}
                            }),
                            div({
                                className: 'audio-en audio',
                                style: {
                                    backgroundPosition: 0 + 'px ' + -i * config.lineHeight + 'px',
                                    backgroundSize: `${config.audioWidth}px ${this.audioHeight}px`
                                }
                            }),
                            React.createElement(PathComponent, {
                                model: this.model,
                                lineN: i
                            }),
                            div({className: 'audio-ru'}),
                            div({className: 'lng en', 'data-lang': 'en'},
                                line.words.en.map((block, pos)=>
                                    span({}, block))),
                            div({className: 'lng ru', 'data-lang': 'ru'},
                                line.words.ru.map((block, pos)=>
                                    span({}, block)))
                        )
                ));
        }
    }
}