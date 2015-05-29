///<reference path="config.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="Events.ts"/>
///<reference path="PathComponent.ts"/>
///<reference path="AudioPlayer.ts"/>
///<reference path="AudioSelection.ts"/>
///<reference path="AudioSelectionComponent.ts"/>
///<reference path="KeyManager.ts"/>
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

        constructor() {
            super(null, null);
            glob.editor = this;
        }

        getSelectionOnClick(e:MouseEvent) {
            var parents = getParents(<Node>e.target, this.el);
            var line:number;
            var lang:string;
            var pos:number;
            for (var i = 0; i < parents.length; i++) {
                var node = parents[i];
                if (node.tagName == 'SPAN') {
                    pos = Array.prototype.slice.call(node.parentNode.childNodes).indexOf(node);
                }
                if (node.dataset && node.dataset['lang']) {
                    lang = node.dataset['lang'];
                }
                if (node.dataset && node.dataset['line']) {
                    line = +node.dataset['line'];
                    this.model.sel.line = line;
                    this.model.sel.lang = lang === void 0 ? 'en' : lang;
                    this.model.sel.pos = pos === void 0 ? 0 : pos;
                    return true;
                }
            }
            return false;
        }

        updateCursor() {
            var selected = (<HTMLElement>this.el.querySelector('.selected'));
            if (selected) {
                selected.classList.remove('selected');
            }
            for (var current of <HTMLElement[]>[].slice.call(this.el.querySelectorAll('.current'))) {
                current.classList.remove('current');
            }

            var line = <HTMLElement>this.el.querySelector(`[data-line="${this.model.sel.line}"]`);
            if (line) {
                var lng = <HTMLElement>line.querySelector(`.lng.${this.model.sel.lang}`);
                if (lng) {
                    var span = <HTMLElement>lng.querySelectorAll(`span`)[this.model.sel.pos];
                    if (span) {
                        //line.classList.add('current');
                        //lng.classList.add('current');
                        span.classList.add('selected');
                    }
                }
            }
        }

        getCurrentLineWords() {
            return <HTMLElement[]>[].slice.call(document.querySelectorAll(`.visible[data-line="${this.model.sel.line}"] .${this.model.sel.lang} span`));
        }

        moveCaretUpDown(isUp = false) {
            var currentLineWords = this.getCurrentLineWords();
            var currentWord = currentLineWords[this.model.sel.pos];
            if (currentWord) {
                this.setLineWhenUpDown(isUp);
                var closestWord = this.setPosToClosestNextWord(currentWord);
                var scrollTop = document.body.scrollTop;
                var scrollBottom = scrollTop + window.innerHeight;
                var wordOffsetTop = currentWord.offsetTop;
                if (isUp && wordOffsetTop < scrollTop + 70) {
                    window.scrollTo(0, scrollTop - wordOffsetTop + closestWord.offsetTop);
                }
                if (!isUp && wordOffsetTop > scrollBottom - 70) {
                    window.scrollTo(0, scrollTop + closestWord.offsetTop - wordOffsetTop);
                }
            }
            this.updateCursor();
        }

        leftRight(left = false) {
            if (left && this.model.sel.pos > 0) {
                this.model.sel.pos--;
                this.model.sel.leftOffset = -1;
            }
            var lineLen = this.model.lines[this.model.sel.line].words[this.model.sel.lang].length;
            if (!left && this.model.sel.pos < lineLen - 1) {
                this.model.sel.pos++;
                this.model.sel.leftOffset = -1;
            }
            this.updateCursor();
        }

        setLineWhenUpDown(isUp = false) {
            var isDown = !isUp;
            if (this.model.sel.lang == 'en') {
                if (isUp) {
                    if (this.model.sel.line == 0) {
                        return false;
                    }
                    this.model.sel.line--;
                }
                this.model.sel.lang = 'ru';
            }
            else {
                if (isDown) {
                    if (this.model.sel.line == this.model.lines.length - 1) {
                        return false;
                    }
                    this.model.sel.line++;
                }
                this.model.sel.lang = 'en';
            }
            return true;
        }

        setPosToClosestNextWord(currentWord:HTMLElement) {
            if (this.model.sel.leftOffset == -1) {
                this.model.sel.leftOffset = currentWord.offsetLeft;
            }
            var closest = -1;
            var closestDiff = Infinity;
            var nextWords = this.getCurrentLineWords();
            var closestNode:HTMLElement;
            for (var i = 0; i < nextWords.length; i++) {
                var nextWord = <HTMLElement>nextWords[i];
                var diff = Math.abs(this.model.sel.leftOffset - nextWord.offsetLeft);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestNode = nextWord;
                    closest = i;
                }
            }
            if (closest > -1) {
                this.model.sel.pos = closest;
            }
            return closestNode;
        }

        insertLine(cut = false) {
            var line = this.model.sel.line;
            var lang = this.model.sel.lang;
            var pos = this.model.sel.pos;
            var lines = this.model.lines;
            if (lines[line] && lines[line].model.lang[lang]) {
                var cutPos = lines[line].words[lang].slice(0, pos).join("").length;
                var change = linesStore.insertLine(cutPos, line, lang);
                if (change) {
                    this.model.sel.line++;
                    this.model.sel.pos = 0;
                    change.cursorBefore = {line: line, pos: pos};
                    change.cursorAfter = {line: this.model.sel.line, pos: this.model.sel.pos};
                    this.model.historyService.add(change);
                    this.forceUpdate();
                }
            }
        }

        removeLine(append = false) {
            var line = this.model.sel.line;
            var lang = this.model.sel.lang;
            var pos = this.model.sel.pos;
            var prevLine = this.model.lines[line - 1];
            var prevLineIsEmpty = prevLine ? prevLine.model.lang[lang].isEmpty() : false;
            var change = linesStore.removeLine(append, line, lang);
            if (change) {
                if (prevLine) {
                    if (prevLineIsEmpty) {
                        this.model.sel.pos = 0;
                    }
                    else {
                        this.model.sel.pos = prevLine.words[lang].length;
                    }
                }
                if (append) {
                    this.model.sel.line--;
                }
                else {
                    if (this.model.sel.line === this.model.lines.length - 1) {
                        this.model.sel.line--;
                    }
                    this.model.sel.pos = 0;
                }
                change.cursorBefore = {line: line, pos: pos};
                change.cursorAfter = {line: this.model.sel.line, pos: this.model.sel.pos};
                this.model.historyService.add(change);
                this.forceUpdate();
            }
        }

        linkedNegate() {
            //console.log("linked");
            this.model.lines[this.model.sel.line].model.linked = !this.model.lines[this.model.sel.line].model.linked;
            this.forceUpdate();
        }

        collapse(e:MouseEvent) {
            var el = <HTMLElement>e.target;
            if (el.dataset['collapsible']) {
                var fromLine = +el.dataset['line'];
                var collapseLine = this.model.collapsedLines[fromLine];
                var toLine = fromLine + collapseLine.length;
                for (var i = fromLine; i < toLine; i++) {
                    this.model.lines[i].hidden = !collapseLine.collapsed;
                }
                collapseLine.collapsed = !collapseLine.collapsed;
            }
            this.forceUpdate();
        }

        getThumbPos(time:number) {
            //var time = this.fromVisibleToTime(i);
            var width = 100; //243
            var height = config.lineHeight;//100;
            var rounded = 0;//i % 2 * 50;
            //i = (i / 2 | 0) * 2;
            return `${(-time % 20) * width}px ${(-time / 20 | 0) * height - rounded}px`;
        }

        hideEmptyLines() {
            for (let line in this.model.collapsedLines) {
                let fromLine = +line;
                var collapseLine = this.model.collapsedLines[fromLine];
                if (collapseLine) {
                    console.log(fromLine, collapseLine);

                    var toLine = fromLine + collapseLine.length;
                    for (var i = fromLine; i < toLine; i++) {
                        this.model.lines[i].hidden = true;
                    }
                    collapseLine.collapsed = true;
                }
            }
            this.forceUpdate();
        }

        componentDidUpdate() {
            this.updateCursor();
        }

        componentWillMount() {
            this.model.prepareData(linesStore);
            this.model.prepareHideLines();
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

            this.events.up.listen(()=>this.moveCaretUpDown(true));
            this.events.down.listen(()=>this.moveCaretUpDown(false));
            this.events.left.listen(()=>this.leftRight(true));
            this.events.right.listen(()=>this.leftRight(false));
            this.events.insertLine.listen(()=>this.insertLine());
            this.events.appendLine.listen(()=>this.removeLine(true));
            this.events.removeLine.listen(()=>this.removeLine(false));
            this.events.linkedNegate.listen(()=>this.linkedNegate());
            this.events.mouseClick.listen(e=>this.getSelectionOnClick(e));
            //this.events.mouseClick.listen(e=>this.mouseClick(e));
            this.events.undo.listen(()=>this.model.undo());
            this.events.redo.listen(()=>this.model.redo());

            this.el.addEventListener('click', e => this.events.mouseClick.emit(e));
            this.el.addEventListener('mousedown', e => this.events.mouseDown.emit(e));

            this.updateCursor();
        }

        render() {
            return div({className: 'editor'},
                div({className: 'panel'},
                    React.DOM.button({onClick: ()=>this.hideEmptyLines()}, 'Hide')
                ),
                React.createElement(AudioSelectionComponent, {
                    model: this.model,
                    events: this.events
                }),
                this.model.lines.map(
                    (line, i) =>[
                        div({
                                className: cx({
                                    line: true,
                                    hidden: line.hidden,
                                    visible: !line.hidden,
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
                        ),
                        this.model.collapsedLines[i + 1] ?
                            div({
                                onClick: (e:React.MouseEvent)=>this.collapse(<MouseEvent>e.nativeEvent),
                                className: cx({
                                    collapsible: true,
                                    collapsed: this.model.collapsedLines[i + 1].collapsed
                                }),
                                'data-collapsible': true,
                                'data-line': i + 1,
                            }) : null
                    ]
                ));
        }

        render2() {
            return vd('div.editor',
                vd('div.panel',
                    vd('button', {events: {click: ()=>this.hideEmptyLines()}}, 'Hide')
                ),
                new AudioSelectionComponent().vd({
                    model: this.model,
                    events: this.events
                }),
                this.model.lines.map(
                    (line, i) =>[
                        vd('div.line', {
                                classes: {
                                    hidden: line.hidden,
                                    visible: !line.hidden,
                                    linked: line.model.linked
                                },
                                dataLine: i,
                                dataMayHide: line.mayHide ? line.mayHide : void 0,
                                dataCollapsed: line.collapsed ? line.collapsed : void 0,
                                dataCollapsibleCount: line.collapsibleCount ? line.collapsibleCount : void 0
                            },
                            vd('div.thumb', {
                                styles: {backgroundPosition: this.getThumbPos(i)}
                            }),
                            vd('div.audio-en.audio', {
                                styles: {
                                    backgroundPosition: `0px ${-i * config.lineHeight}px`,
                                    backgroundSize: `${config.audioWidth}px ${this.audioHeight}px`
                                }
                            }),
                            new PathComponent({
                                model: this.model,
                                lineN: i
                            }),
                            vd('.audio-ru'),
                            vd('.lng.en', {dataLang: 'en'},
                                line.words.en.map((block, pos)=>
                                    vd('span', block))),
                            vd('.lng.ru', {dataLang: 'ru'},
                                line.words.ru.map((block, pos)=>
                                    vd('span', block)))
                        ),
                        this.model.collapsedLines[i + 1] ?
                            vd({
                                events: {
                                    click: (e:MouseEvent) => this.collapse(e),
                                },
                                classes: {
                                    collapsible: true,
                                    collapsed: this.model.collapsedLines[i + 1].collapsed
                                },
                                dataCollapsible: true,
                                dataLine: i + 1,
                            }) : void 0
                    ]
                ));

        }
    }
}