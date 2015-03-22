class WordSelection {
    line = 0;
    pos = 0;
    lang = 'en';
    leftOffset = -1;
}


class LineView {
    model:Line;
    words:{[index: string]: string[]; en: string[]; ru: string[]};

    constructor(model:Line, en:string[], ru:string[]) {
        this.model = model;
        this.words = {en: en, ru: ru};
    }
}


class EditorView extends React.Component<any,any> {
    lines:LineView[];
    sel = new WordSelection();

    constructor() {
        super(null, null);
    }
    syncAudioLines() {
        var timeX = 50;
        var svgC = '';
        var lineHeight = 50;

        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            var end = line.model.lang.en.end / 100;
            var start = line.model.lang.en.start / 100;
            var dur = (end - start);
            if (!line.model.lang.en.isEmpty()) {
                // onclick="play(' + start + ',' + dur + ')"
                svgC += '<path d="' +
                this.pathGenerator(start * timeX, dur * timeX,
                    i * lineHeight, lineHeight, 50) +
                '" stroke="transparent" fill="hsla(' + (start * 77 | 0) + ', 50%,60%, 1)"/>';
            }
        }
        var svg = document.getElementById('svg');
        if (svg) {
            svg.innerHTML = svgC;
        }
    }

    play(from:number, dur:number) {
        /*from = from - (12 * 60 + .5);
        console.log(from, dur);
        audio.play();
        audio.currentTime = from;
        audio.playbackRate = .8;
        setTimeout(function () {
            audio.pause();
        }, dur * 1250);*/

    }

    pathGenerator(topLeft:number, leftHeight:number, topRight:number, rightHeight:number, width:number) {
        topLeft = Math.round(topLeft);
        leftHeight = Math.round(leftHeight);
        topRight = Math.round(topRight);
        rightHeight = Math.round(rightHeight);
        width = Math.round(width);
        var bx = width / 2 | 0;
        var path = '';

        path += 'M0,' + topLeft + ' ';

        path += 'C' + bx + ',' + topLeft + ' ';
        path += bx + ',' + topRight + ' ';
        path += width + ',' + topRight + ' ';

        path += 'L' + width + ',' + (topRight + rightHeight) + ' ';

        path += 'C' + bx + ',' + (topRight + rightHeight) + ' ';
        path += bx + ',' + (topLeft + leftHeight) + ' ';
        path += '0,' + (topLeft + leftHeight) + 'Z';
        return path;
    }

    insertLine(cut = false) {
        var line = this.sel.line;
        var lang = this.sel.lang;
        var pos = this.sel.pos;
        if (this.lines[line] && this.lines[line].model.lang[lang]) {
            var cutPos = this.lines[line].words[lang].slice(0, pos).join("").length;
            var change = linesStore.insertLine(cutPos, line, lang);
            if (change) {
                this.sel.line++;
                this.sel.pos = 0;
                change.cursorBefore = {line: line, pos: pos};
                change.cursorAfter = {line: this.sel.line, pos: this.sel.pos};
                historyService.add(change);
                this.forceUpdate();
            }
        }
    }

    removeLine(append = false) {
        var line = this.sel.line;
        var lang = this.sel.lang;
        var pos = this.sel.pos;
        var prevLine = this.lines[line - 1];
        var prevLineIsEmpty = prevLine ? prevLine.model.lang[lang].isEmpty() : false;
        var change = linesStore.removeLine(append, line, lang);
        if (change) {
            if (prevLine) {
                if (prevLineIsEmpty) {
                    this.sel.pos = 0;
                }
                else {
                    this.sel.pos = prevLine.words[lang].length;
                }
            }
            if (append) {
                this.sel.line--;
            }
            else {
                if (this.sel.line === this.lines.length - 1) {
                    this.sel.line--;
                }
                this.sel.pos = 0;
            }
            change.cursorBefore = {line: line, pos: pos};
            change.cursorAfter = {line: this.sel.line, pos: this.sel.pos};
            historyService.add(change);
            this.forceUpdate();
        }
    }

    setLineWhenUpDown(isUp = false) {
        var isDown = !isUp;
        if (this.sel.lang == 'en') {
            if (isUp) {
                if (this.sel.line == 0) {
                    return false;
                }
                this.sel.line--;
            }
            this.sel.lang = 'ru';
        }
        else {
            if (isDown) {
                if (this.sel.line == this.lines.length - 1) {
                    return false;
                }
                this.sel.line++;
            }
            this.sel.lang = 'en';
        }
        return true;
    }

    setPosToClosestNextWord(currentWord:HTMLElement) {
        if (this.sel.leftOffset == -1) {
            this.sel.leftOffset = currentWord.offsetLeft;
        }
        var closest = -1;
        var closestDiff = Infinity;
        var nextWords = document.querySelectorAll('[data-line="' + this.sel.line + '"] .' + this.sel.lang + ' span');
        var closestNode:HTMLElement;
        for (var i = 0; i < nextWords.length; i++) {
            var nextWord = <HTMLElement>nextWords[i];
            var diff = Math.abs(this.sel.leftOffset - nextWord.offsetLeft);
            if (diff < closestDiff) {
                closestDiff = diff;
                closestNode = nextWord;
                closest = i;
            }
        }
        if (closest > -1) {
            this.sel.pos = closest;
        }
        return closestNode;
    }

    moveCaretUpDown(isUp = false) {
        var currentLineWords = document.querySelectorAll('[data-line="' + this.sel.line + '"] .' + this.sel.lang + ' span');
        var currentWord = <HTMLElement>currentLineWords[this.sel.pos];
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
        this.forceUpdate();
    }

    leftRight(left = false) {
        if (left && this.sel.pos > 0) {
            this.sel.pos--;
            this.sel.leftOffset = -1;
        }
        var lineLen = this.lines[this.sel.line].words[this.sel.lang].length;
        if (!left && this.sel.pos < lineLen - 1) {
            this.sel.pos++;
            this.sel.leftOffset = -1;
        }
        this.forceUpdate();
    }

    wordClick(node:HTMLElement) {
        var langEl = <HTMLElement>node.parentNode;
        this.sel.lang = (<any>langEl.dataset)['lang'];
        var lineEl = <HTMLElement>langEl.parentNode;
        this.sel.line = +(<any>lineEl.dataset)['line'];
        var arr = Array.prototype.slice.call(langEl.querySelectorAll('span'));
        this.sel.pos = arr.indexOf(node);
        this.forceUpdate();
    }

    undo() {
        var change = historyService.back();
        if (change) {
            linesStore.undo(change);
            this.sel.line = change.cursorBefore.line;
            this.sel.pos = change.cursorBefore.pos;
            this.sel.leftOffset = -1;
            this.sel.lang = change.lang;
            this.forceUpdate();
        }
    }

    redo() {
        var change = historyService.forward();
        if (change) {
            linesStore.redo(change);
            this.sel.line = change.cursorAfter.line;
            this.sel.pos = change.cursorAfter.pos;
            this.sel.leftOffset = -1;
            this.sel.lang = change.lang;
            this.forceUpdate();
        }
    }

    linkedNegate() {
        //console.log("linked");
        this.lines[this.sel.line].model.linked = !this.lines[this.sel.line].model.linked;
        this.forceUpdate();
    }
    forceUpdate(){
        setTimeout(()=>super.forceUpdate());
    }

    componentDidMount() {
        var el = React.findDOMNode(this);
        el.addEventListener('click', (e) => {
            var parents = <HTMLElement[]>[];
            var target = <HTMLElement>e.target;
            var node = target;
            while (node = <HTMLElement>node.parentNode) {
                parents.push(node);
            }
            if (target.tagName === 'SPAN') {
                this.wordClick(target);
                return;
            }

            for (var i = 0; i < parents.length; i++) {
                var node = parents[i];
                if (node.dataset && node.dataset['line']) {
                    this.sel.lang = 'en';
                    this.sel.line = +node.dataset['line'];
                    this.sel.pos = 0;
                    this.forceUpdate();
                    return;
                }
            }
        });

        document.addEventListener("keydown", (e:KeyboardEvent) => {
            var key = new KeyPress(e);
            if ((key.left || key.right) && key.noMod) {
                this.leftRight(key.left);
                e.preventDefault();
            }

            if (key.z && key.metaMod && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.undo();
                e.preventDefault();
            }

            if (key.z && key.metaMod && key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.redo();
                e.preventDefault();
            }

            if (key.enter && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.insertLine(!key.metaMod);
                e.preventDefault();
            }

            if (key.enter && key.shiftMod && !key.altMod && !key.ctrlMod && !key.metaMod) {
                this.linkedNegate();
                e.preventDefault();
            }

            if (key.space && key.noMod) {
                this.linkedNegate();
                e.preventDefault();
            }

            if (key.backspace && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.removeLine(!key.metaMod);
                e.preventDefault();
            }

            if ((key.down || key.up) && !key.metaMod) {
                this.moveCaretUpDown(key.up);
                e.preventDefault();
            }
        });
    }

    prepareData(linesStore:LinesStore) {
        this.lines = linesStore.map((line, i)=> new LineView(line,
                this.parse(line.lang.en && line.lang.en.text),
                this.parse(line.lang.ru && line.lang.ru.text)
            )
        );
        this.syncAudioLines();
    }

    parse(str:string) {
        var regexp = /(\s*?([-–—][ \t]+)?[\wа-яА-Я'`]+[^\s]*)/g;
        var m:string[];
        var pos = 0;
        var block:string[] = [];
        while (m = regexp.exec(str)) {
            block.push(m[1]);
            pos++;
        }
        if (pos === 0) {
            block.push(' ');
        }
        return block;
    }

    render() {
        this.prepareData(linesStore);

        return div({className: 'editor'},
            React.DOM.svg({id: "svg", width: 50, height: 30000}),
            this.lines.map(
                (line, i) =>
                    div({
                            className: cx({line: true, 'current': i === this.sel.line, linked: line.model.linked}),
                            'data-line': i
                        },
                        div({className: 'audio-en', style: {backgroundPosition: 0 + 'px ' + (-i + 6) * 50 + 'px'}}),
                        div({className: 'audio-ru'}),
                        div({
                                className: cx({
                                    lng: true,
                                    en: true,
                                    'current': i === this.sel.line && 'en' === this.sel.lang
                                }), 'data-lang': 'en'
                            },
                            line.words.en.map((block, pos)=>
                                    span({
                                        className: cx({
                                            selected: i === this.sel.line && 'en' === this.sel.lang && pos === this.sel.pos
                                        })
                                    }, block)
                            )
                        ),
                        div({
                                className: cx({
                                    lng: true,
                                    ru: true,
                                    'current': i === this.sel.line && 'ru' === this.sel.lang
                                }), 'data-lang': 'ru'
                            },
                            line.words.ru.map((block, pos)=>
                                    span({
                                        className: cx({
                                            selected: i === this.sel.line && 'ru' === this.sel.lang && pos === this.sel.pos
                                        })
                                    }, block)
                            )
                        )
                    )
            ));
    }
}