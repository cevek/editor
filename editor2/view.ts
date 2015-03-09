class WordSelection {
    line = 0;
    pos = 0;
    lang = 'en';
    leftOffset = -1;
}

interface ILineView {[n: string]: TextView}
class LineView extends Line implements ILineView {
[lang:string]:TextView;
    en:TextView;
    ru:TextView;
}
class TextView extends TextLine {
    constructor(text:TextLine, public words:string[]) {
        super({start: text.start, end: text.end, text: text.text});
        copy(text, this);
    }
}

class EditorView extends React.Component<any,any> {
    lines:LineView[];
    sel = new WordSelection();

    constructor() {
        super(null, null);
    }

    insertLine(cut = false) {
        var line = this.sel.line;
        var lang = this.sel.lang;
        var pos = this.sel.pos;
        var cutPos = this.lines[line][lang].words.slice(0, pos).join("").length;
        var h = linesStore.insertLine(cut, cutPos, line, lang, pos);
        this.sel.line++;
        this.sel.pos = 0;

        var change = new Change(lang, h.change, h.insert, h.remove,
            {line: line, pos: pos},
            {line: this.sel.line, pos: this.sel.pos}
        );
        historyService.add(change);
        this.forceUpdate();
    }

    removeLine(append = false) {
        var line = this.sel.line;
        var lang = this.sel.lang;
        var pos = this.sel.pos;
        var h = linesStore.removeLine(append, line, lang);

        var prevLine = this.lines[line - 1] ? this.lines[line - 1][lang] : null;
        if (prevLine) {
            if (prevLine.isEmpty()) {
                this.sel.pos = 0;
            }
            else {
                this.sel.pos = prevLine.words.length;
            }
        }
        if (append) {
            this.sel.line--;
        }
        else {
            this.sel.pos = 0;
        }

        var change = new Change(lang,
            h.change,
            h.insert,
            h.remove,
            {line: line, pos: pos},
            {line: this.sel.line, pos: this.sel.pos}
        );

        historyService.add(change);
        this.forceUpdate();
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
        var lineLen = this.lines[this.sel.line][this.sel.lang].words.length;
        if (!left && this.sel.pos < lineLen - 1) {
            this.sel.pos++;
            this.sel.leftOffset = -1;
        }
        this.forceUpdate();
    }

    wordClick(node:HTMLElement) {
        var langEl = <HTMLElement>node.parentNode;
        this.sel.lang = langEl.dataset['lang'];
        var lineEl = <HTMLElement>langEl.parentNode;
        this.sel.line = +lineEl.dataset['line'];
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

    componentDidMount() {
        var el = React.findDOMNode(this);
        el.addEventListener('click', (e) => {
            var node = <HTMLElement>e.target;
            if (node.tagName === 'SPAN') {
                this.wordClick(node);
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
        this.lines = linesStore.map((line, i)=> new LineView(
                new TextView(line.en, this.parse(line.en && line.en.text)),
                new TextView(line.ru, this.parse(line.ru && line.ru.text))
            )
        );
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

        return div(null,
            this.lines.map(
                (line, i) =>
                    div({className: cx({line: true, 'current': i === this.sel.line}), 'data-line': i},
                        div({className: 'audio-en', style: {backgroundPosition: 0 + 'px ' + -i * 50 + 'px'}}),
                        div({className: 'audio-ru'}),
                        div({
                                className: cx({
                                    lng: true,
                                    en: true,
                                    'current': i === this.sel.line && 'en' === this.sel.lang
                                }), 'data-lang': 'en'
                            },
                            line.en.words.map((block, pos)=>
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
                            line.ru.words.map((block, pos)=>
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