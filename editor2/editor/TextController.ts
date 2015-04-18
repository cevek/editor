module editor {
    export class WordSelection {
        line = 0;
        pos = 0;
        lang = 'en';
        leftOffset = -1;
    }

    export class TextController {
        constructor(private model:Model,
                    private eventEmitter:EventEmitter<Action>,
                    private el:HTMLElement,
                    private forceUpdate:()=>void) {

            this.eventEmitter.listen(action => {
                switch (action) {
                    case Action.DOWN:
                        this.moveCaretUpDown(false);
                        break;
                    case Action.UP:
                        this.moveCaretUpDown(true);
                        break;
                    case Action.LEFT:
                        this.leftRight(true);
                        break;
                    case Action.RIGHT:
                        this.leftRight(false);
                        break;
                    case Action.INSERT_LINE:
                        this.insertLine();
                        break;
                    case Action.REMOVE_LINE:
                        this.removeLine(false);
                        break;
                    case Action.APPEND_LINE:
                        this.removeLine(true);
                        break;
                    case Action.LINKED_NEGATE:
                        this.linkedNegate();
                        break;
                }
            });
            this.el.addEventListener('click', e => this.mouseClick(e));
        }

        mouseClick(e:MouseEvent) {
            var parents = this.getParents(<HTMLElement>e.target);
            var selectedLine = this.getSelectionOnClick(parents);
            if (selectedLine) {
                this.collapse(parents);
            }
            this.forceUpdate();
            //this.clickHandler(<HTMLElement>e.target);
        }

        getSelectionOnClick(parents:HTMLElement[]) {
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

        getParents(target:HTMLElement) {
            var node = target;
            var parents = <HTMLElement[]>[node];
            while ((node = <HTMLElement>node.parentNode) && node != this.el.parentNode) {
                parents.push(node);
            }
            return parents;
        }

        updateCursor() {
            var el = <HTMLElement>React.findDOMNode(this.el);
            var selected = (<HTMLElement>el.querySelector('.selected'));
            if (selected) {
                selected.classList.remove('selected');
            }
            for (var current of <HTMLElement[]>[].slice.call(el.querySelectorAll('.current'))) {
                current.classList.remove('current');
            }

            var line = <HTMLElement>el.querySelector(`[data-line="${this.model.sel.line}"]`);
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

        moveCaretUpDown(isUp = false) {
            var currentLineWords = document.querySelectorAll('[data-line="' + this.model.sel.line + '"] .' + this.model.sel.lang + ' span');
            var currentWord = <HTMLElement>currentLineWords[this.model.sel.pos];
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
            var nextWords = document.querySelectorAll('[data-line="' + this.model.sel.line + '"] .' + this.model.sel.lang + ' span');
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
                    historyService.add(change);
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
                historyService.add(change);
                this.forceUpdate();
            }
        }

        undo(change:Change) {
            this.model.sel.line = change.cursorBefore.line;
            this.model.sel.pos = change.cursorBefore.pos;
            this.model.sel.leftOffset = -1;
            this.model.sel.lang = change.lang;
        }

        redo(change:Change) {
            this.model.sel.line = change.cursorAfter.line;
            this.model.sel.pos = change.cursorAfter.pos;
            this.model.sel.leftOffset = -1;
            this.model.sel.lang = change.lang;

        }

        linkedNegate() {
            //console.log("linked");
            this.model.lines[this.model.sel.line].model.linked = !this.model.lines[this.model.sel.line].model.linked;
            this.forceUpdate();
        }

        collapse(parents:HTMLElement[]) {
            if (parents.some(
                        parent=>parent.classList.contains('audio') || parent.classList.contains('thumb') || parent.tagName == 'svg')) {
                return;
            }
            var line = this.model.lines[this.model.sel.line];
            if (!line.mayHide && !line.collapsibleCount) {
                return;
            }
            for (var i = this.model.sel.line; i < this.model.lines.length; i++) {
                var line = this.model.lines[i];
                if (line.collapsibleCount) {
                    var collapseLine = line;
                    break;
                }
            }
            if (collapseLine) {
                var hidden = !collapseLine.collapsed;
                for (var j = i - 1; j >= i - collapseLine.collapsibleCount; j--) {
                    this.model.lines[j].hidden = hidden;
                    //console.log({collapseLine, hidden, i, j, line: this.lines[j]});
                }
                collapseLine.collapsed = hidden;
                this.eventEmitter.emit(Action.UPDATE_AUDIO_SELECTION);
                this.forceUpdate();
            }
        }

    }
}