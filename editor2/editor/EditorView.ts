///<reference path="config.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="Events.ts"/>
///<reference path="Path.ts"/>
///<reference path="AudioPlayer.ts"/>
///<reference path="AudioSelection.ts"/>
///<reference path="KeyManager.ts"/>
///<reference path="TextController.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Model.ts"/>
///<reference path="Toolbar.ts"/>

module editor {
    export class EditorView extends React.Component<any,any> {
        el:HTMLElement;
        offsetTop = 0;

        audioHeight = 30000 / (50 * config.lineDuration / config.lineHeight);

        textEditor:TextController;
        audioSelection:AudioSelection;

        model = new Model;
        path = new Path(this.model);
        //eventEmitter = new EventEmitter<Action>();
        events = new Events;
        toolbar = new Toolbar(this.model, this.events);
        keyManager = new KeyManager(this.events);
        historyService = new HistoryService();

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

            this.audioSelection = new AudioSelection(
                this.model,
                this.events,
                this.el.offsetTop,
                <HTMLElement>React.findDOMNode(this.refs['audioSelection']),
                <HTMLElement>React.findDOMNode(this.refs['currentTime'])
            );
            this.textEditor = new TextController(
                this.model,
                this.events,
                this.historyService,
                this.el,
                ()=>this.forceUpdate());
            this.textEditor.updateCursor();
        }

        render() {
            this.model.prepareData(linesStore);
            this.path.generatePath();
            this.model.prepareHideLines();

            return div({className: 'editor'},
                div({className: 'panel'},
                    React.DOM.button({onClick: ()=>this.toolbar.hideEmptyLines()}, 'Hide')
                ),
                div({className: 'relative'},
                    div({className: 'audio-selection audio', ref: 'audioSelection'}),
                    div({className: 'current-time audio', ref: 'currentTime'})
                ),
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
                            React.DOM.svg({width: config.svgWidth, height: config.lineHeight},
                                line.path.map(path=>[
                                    React.DOM.path({
                                        onClick: ()=> this.audioSelection.playLine(path.i),
                                        //onMouseEnter: ()=>console.log("enter", j),
                                        //onMouseLeave: ()=>console.log("leave", j),
                                        stroke: "transparent",
                                        d: path.path,
                                        fill: 'hsla(' + (this.model.lines[path.i].model.lang.en.start / 10 | 0) + ', 50%,60%, 1)'
                                    }),
                                    React.DOM.rect(<any>{
                                        onClick: (e:React.MouseEvent)=>
                                            this.path.resizeTime(<MouseEvent>e.nativeEvent, path.i, Pos.TOP),
                                        x: 0,
                                        y: path.top - 10,
                                        width: 20,
                                        height: 20
                                    }),
                                    React.DOM.rect(<any>{
                                        onClick: (e:React.MouseEvent)=>
                                            this.path.resizeTime(<MouseEvent>e.nativeEvent, path.i, Pos.BOTTOM),
                                        x: 0,
                                        y: path.top + path.height - 10,
                                        width: 20,
                                        height: 20
                                    })
                                ])),
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