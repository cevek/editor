module ag {
    class TextPiece {
        constructor(public value:string, public selected = false) {

        }
    }

    class Selection {
        line = 0;
        pos = 0;
        lang = 'en';
        leftOffset = -1;
    }

    class LineView extends Line {
    [lang:string]:TextView;
        en:TextView;
        ru:TextView;
    }
    class TextView extends Text {
        constructor(text:Text, public words:TextPiece[]) {
            super(text.start, text.end, text.text);
            copy(text, this);
        }
    }

    export class EditorView extends React.Component<any,any> {
        lines:List<LineView>;
        sel = new Selection();

        constructor() {
            super(null, null);
        }

        insertLine(cut = false) {
            var cutPos = this.lines[this.sel.line][this.sel.lang].words.slice(0, this.sel.pos).map(w=>w.value).join("").length;
            linesStore.insertLine(cut, cutPos, this.sel.line, this.sel.lang, this.sel.pos);
            this.sel.line++;
            this.sel.pos = 0;
            this.forceUpdate();
        }

        removeLine(append = false) {
            linesStore.removeLine(append, this.sel.line, this.sel.lang);
            var prevLine = this.lines[this.sel.line - 1][this.sel.lang];
            if (prevLine.words.length === 1 && prevLine.words[0].value.trim() === '') {
                this.sel.pos = 0;
            }
            else {
                this.sel.pos = prevLine.words.length;
            }
            if (append) {
                this.sel.line--;
            }
            else {
                this.sel.pos = 0;
            }
            this.forceUpdate();
        }

        setLineWhenUpDown(isUp = false) {
            if (this.sel.lang == 'en') {
                if (isUp) {
                    if (this.sel.line == 0) {
                        return;
                    }
                    this.sel.line--;
                }
                this.sel.lang = 'ru';
            }
            else {
                if (this.sel.line == this.lines.length - 1) {
                    return;
                }
                this.sel.lang = 'en';
                if (!isUp) {
                    this.sel.line++;
                }
            }
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

        componentDidMount() {
            var el = React.findDOMNode(this);
            el.addEventListener('click', (e) => {
                var node = <HTMLElement>e.target;
                if (node.tagName === 'SPAN') {
                    this.wordClick(node);
                }
            });

            document.addEventListener("keydown", (e:KeyboardEvent) => {
                var key = new Key(e);
                if ((key.left || key.right) && key.noMod) {
                    this.leftRight(key.left);
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
            this.lines = new List(linesStore.map((line, i)=> new LineView(
                    new TextView(line.en, this.parse(line.en && line.en.text, i, 'en')),
                    new TextView(line.ru, this.parse(line.ru && line.ru.text, i, 'ru'))
                )
            ));
        }

        parse(str:string, lineN:number, lang:string) {
            var regexp = /(\s*?([-–—][ \t]+)?[\wа-яА-Я'`]+[^\s]*)/g;
            var m = [];
            var pos = 0;
            var block:TextPiece[] = [];
            while (m = regexp.exec(str)) {
                var selected = this.sel.line === lineN && pos === this.sel.pos && lang === this.sel.lang;
                block.push(new TextPiece(m[1], selected));
                pos++;

            }
            if (pos === 0) {
                var selected = this.sel.line === lineN && pos === this.sel.pos && lang === this.sel.lang;
                block.push(new TextPiece(' ', selected));
            }
            return block;
        }

        render() {
            this.prepareData(linesStore);

            return div(null,
                this.lines.map(
                    (line, i) =>
                        div({className: cx({line: true, 'current': i === this.sel.line}), 'data-line': i},
                            div({
                                    className: cx({
                                        lng: true,
                                        en: true,
                                        'current': i === this.sel.line && 'en' === this.sel.lang
                                    }), 'data-lang': 'en'
                                },
                                line.en.words.map((block)=>
                                        span({
                                            className: cx({
                                                selected: block.selected
                                            })
                                        }, block.value)
                                )
                            ),
                            div({
                                    className: cx({
                                        lng: true,
                                        ru: true,
                                        'current': i === this.sel.line && 'ru' === this.sel.lang
                                    }), 'data-lang': 'ru'
                                },
                                line.ru.words.map((block)=>
                                        span({
                                            className: cx({
                                                selected: block.selected
                                            })
                                        }, block.value)
                                )
                            )
                        )
                ));
        }
    }
}