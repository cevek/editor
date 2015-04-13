class WordSelection {
    line = 0;
    pos = 0;
    lang = 'en';
    leftOffset = -1;
}

class LineView {
    model:Line;
    words:{[index: string]: string[]; en: string[]; ru: string[]};
    hidden = false;
    mayHide = false;
    collapsibleCount = 0;
    collapsed = false;
    haveCrossedPath = false;
    path:{i: number;path:string}[];

    constructor(model:Line, en:string[], ru:string[], oldLine?:LineView) {
        this.model = model;
        this.words = {en: en, ru: ru};
        if (oldLine) {
            this.hidden = oldLine.hidden;
            this.mayHide = oldLine.mayHide;
            this.collapsed = oldLine.collapsed;
            this.haveCrossedPath = oldLine.haveCrossedPath;
            this.collapsibleCount = oldLine.collapsibleCount;
            this.path = oldLine.path;
        }
    }
}

class EditorView extends React.Component<any,any> {
    lines:LineView[];
    sel = new WordSelection();
    audioContext = new AudioContext();
    audioSelection = {start: 0, end: 0, selecting: false, selectionStart: 0};
    el:HTMLElement;
    offsetTop = 0;
    playingSources:AudioBufferSourceNode[] = [];
    audioRate = 0.8;
    lineDuration = 2;
    lineHeight = 50;
    secondHeight = this.lineHeight / this.lineDuration;
    svgWidth = 50;

    audioWidth = 30;
    audioHeight = 30000 / (50 * this.lineDuration / this.lineHeight);

    constructor() {
        super(null, null);
        glob.editor = this;
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

    generatePath() {
        for (var i = 0; i < this.lines.length; i++) {
            this.lines[i].path = [];
            this.lines[i].haveCrossedPath = false;
            this.lines.forEach((line, j)=> {
                if (line.model.lang.en.start) {
                    var end = line.model.lang.en.end / 100;
                    var start = line.model.lang.en.start / 100;
                    var dur = (end - start);
                    var leftTop = (start * this.secondHeight - this.lineHeight * i) | 0;
                    var leftHeight = dur * this.secondHeight | 0;
                    var rightTop = (j - i) * this.lineHeight;
                    var min = leftTop < rightTop ? leftTop : rightTop;
                    var max = (leftTop + leftHeight) > (rightTop + this.lineHeight)
                        ? leftTop + leftHeight
                        : rightTop + this.lineHeight;

                    if (min < 0 && 0 < max || min < this.lineHeight && this.lineHeight < max) {
                        this.lines[i].haveCrossedPath = true;
                        this.lines[i].path.push({
                            i: j,
                            path: this.pathGenerator(leftTop, leftHeight, rightTop, this.lineHeight, this.svgWidth)
                        });
                    }
                }
            });
        }
    }

    play(i:number) {
        var start = this.lines[i].model.lang.en.start / 100;
        var end = this.lines[i].model.lang.en.end / 100;
        this.audioSelection.start = start;
        this.audioSelection.end = end;
        this.playTime();
    }

    playTime() {
        this.stopPlay();
        var start = this.audioSelection.start;
        var end = this.audioSelection.end;
        var startLine = start / this.lineDuration;
        var endLine = end / this.lineDuration;
        var audioData = linesStore.audioData;
        if (audioData) {
            var dur = end - start;
            if (dur) {
                console.log("play", start, end, dur);

                var channel = audioData.getChannelData(0);

                var sliced:Float32Array[] = [];
                var size = 0;
                this.lines.forEach((line, j) => {
                    if (!line.hidden) {
                        if (j >= Math.floor(startLine) && j < Math.ceil(endLine)) {
                            var addToStart = Math.max(startLine - j, 0);
                            var addToEnd = Math.floor(endLine) == j ? endLine - j : 1;
                            var slice = channel.subarray((j + addToStart) * this.lineDuration * audioData.sampleRate | 0,
                                (j + addToEnd) * this.lineDuration * audioData.sampleRate | 0);
                            sliced.push(slice);
                            size += slice.length;
                        }
                    }
                });
                var buff = this.audioContext.createBuffer(audioData.numberOfChannels, size, audioData.sampleRate);
                sliced.reduce((offset, slice) => {
                    buff.getChannelData(0).set(slice, offset);
                    return offset + slice.length;
                }, 0);
                var source = this.audioContext.createBufferSource();
                source.buffer = buff;
                source.playbackRate.value = this.audioRate;
                source.connect(this.audioContext.destination);
                source.start(0);
                this.playingSources.push(source);
                this.updateAudioSelection(true);
            }
        }

        else {
            console.log("audioData is not loaded yet");
        }
    }

    showAllLines() {
        this.lines.forEach(line => line.hidden = false);
    }

    prepareHideLines() {
        var collapsed = 0;
        var prevLine:LineView;
        this.lines.forEach(line => {
            if (line.model.isEmpty() && !line.haveCrossedPath) {
                collapsed++;
                line.mayHide = true;
            }
            else {
                if (collapsed > 0) {
                    if (line.model.isEmpty()) {
                        line.collapsibleCount = collapsed;
                    }
                    else if (prevLine.model.isEmpty()) {
                        prevLine.collapsibleCount = collapsed - 1;
                        //prevLine.mayHide = false;
                    }
                }

                collapsed = 0;
            }
            prevLine = line;
        });
    }

    hideEmptyLines() {
        this.lines.forEach(line => {
            if (line.collapsibleCount) {
                line.collapsed = true;
            }
            if (line.mayHide) {
                line.hidden = true;
            }
        });

        this.stopPlay();
        this.clearAudioSelection();
        this.forceUpdate();
    }

    stopPlay() {
        var currentTime = (<HTMLElement>React.findDOMNode(this.refs['currentTime']));
        currentTime.style.transition = '';
        this.playingSources.forEach(source=>source.stop());
        this.playingSources = [];
    }

    fromVisibleToTime(top:number) {
        var k = 0;
        var top = top / this.lineHeight;
        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            if (!line.hidden) {
                if (top < k + 1) {
                    return (i + top - k) * this.lineDuration;
                }
                k++;
            }
        }
        return 0;
    }

    timeToVisibleLineN(time:number) {
        var k = 0;
        var lineN = time / this.lineDuration;
        for (var i = 0; i < this.lines.length; i++) {
            var line = this.lines[i];
            //console.log({i, k, time, hidden: line.hidden});
            if (i == Math.floor(lineN)) {
                return (k + (line.hidden ? 0 : lineN % 1)) * this.lineHeight;
            }
            if (!line.hidden) {
                k++;
            }
        }
        return 0;
    }

    selectStart(e:MouseEvent) {
        if ((<HTMLElement>e.target).classList.contains('audio')) {
            this.audioSelection.selecting = true;
            this.audioSelection.start = this.fromVisibleToTime((e.pageY - this.offsetTop));
            this.audioSelection.selectionStart = this.audioSelection.start;
            this.audioSelection.end = this.audioSelection.start;
            this.updateAudioSelection(false);
            e.preventDefault();
        }
    }

    selectMove(e:MouseEvent) {
        if (this.audioSelection.selecting) {
            var end = this.fromVisibleToTime((e.pageY - this.offsetTop));
            if (end <= this.audioSelection.selectionStart) {
                this.audioSelection.start = end;
                this.audioSelection.end = this.audioSelection.selectionStart;
            }
            else {
                this.audioSelection.start = this.audioSelection.selectionStart;
                this.audioSelection.end = end;
            }
            this.updateAudioSelection(false);
        }
    }

    selectEnd(e:MouseEvent) {
        if (this.audioSelection.selecting) {
            this.audioSelection.selecting = false;
            this.playTime();
        }
    }

    clearAudioSelection() {
        this.audioSelection.start = 0;
        this.audioSelection.end = 0;
        this.updateAudioSelection(false);
    }

    updateAudioSelection(startCurrentTime:boolean) {
        var el = (<HTMLElement>React.findDOMNode(this.refs['audioSelectionEl']));
        var start = this.timeToVisibleLineN(this.audioSelection.start);
        var end = this.timeToVisibleLineN(this.audioSelection.end);
        var dur = (this.audioSelection.end - this.audioSelection.start);
        el.style.top = start + 'px';
        el.style.height = (end - start) + 'px';
        if (startCurrentTime) {
            var currentTime = (<HTMLElement>React.findDOMNode(this.refs['currentTime']));
            currentTime.style.transition = '';
            currentTime.style.transform = `translateY(${start}px)`;
            //noinspection BadExpressionStatementJS
            currentTime.offsetHeight; //force reflow
            currentTime.style.transition = 'all linear';
            currentTime.style.transform = `translateY(${end}px)`;
            currentTime.style.transitionDuration = dur / this.audioRate + 's';
        }
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
        this.updateCursor();
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
        this.updateCursor();
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

    updateCursor() {
        var el = <HTMLElement>React.findDOMNode(this);
        var selected = (<HTMLElement>el.querySelector('.selected'));
        if (selected) {
            selected.classList.remove('selected');
        }
        for (var current of <HTMLElement[]>[].slice.call(el.querySelectorAll('.current'))) {
            current.classList.remove('current');
        }

        var line = <HTMLElement>el.querySelector(`[data-line="${this.sel.line}"]`);
        if (line) {
            var lng = <HTMLElement>line.querySelector(`.lng.${this.sel.lang}`);
            if (lng) {
                var span = <HTMLElement>lng.querySelectorAll(`span`)[this.sel.pos];
                if (span) {
                    //line.classList.add('current');
                    //lng.classList.add('current');
                    span.classList.add('selected');
                }
            }
        }
    }

    moveTime(isUp:boolean, isStartTime:boolean, isEndTime:boolean) {
        var t = 30;
        var line = this.lines[this.sel.line];
        if (line.model.lang.en.start) {
            if (isStartTime) {
                line.model.lang.en.start += isUp ? -t : t;
            }
            if (isEndTime) {
                line.model.lang.en.end += isUp ? -t : t;
            }
            this.forceUpdate();
        }
    }

    linkedNegate() {
        //console.log("linked");
        this.lines[this.sel.line].model.linked = !this.lines[this.sel.line].model.linked;
        this.forceUpdate();
    }

    keyManager(key:KeyPress) {
        if ((key.left || key.right) && key.noMod) {
            this.leftRight(key.left);
            return true;
        }

        if (key.z && key.metaMod && !key.shiftMod && !key.altMod && !key.ctrlMod) {
            this.undo();
            return true;
        }

        if (key.z && key.metaMod && key.shiftMod && !key.altMod && !key.ctrlMod) {
            this.redo();
            return true;
        }

        if (key.enter && !key.shiftMod && !key.altMod && !key.ctrlMod) {
            this.insertLine(!key.metaMod);
            return true;
        }

        if (key.enter && key.shiftMod && !key.altMod && !key.ctrlMod && !key.metaMod) {
            this.linkedNegate();
            return true;
        }

        if (key.space && key.noMod) {
            this.linkedNegate();
            return true;
        }

        if (key.tab && key.noMod) {
            this.playTime();
            return true;
        }

        if (key.backspace && !key.shiftMod && !key.altMod && !key.ctrlMod) {
            this.removeLine(!key.metaMod);
            return true;
        }

        if ((key.down || key.up) && (key.shiftLeftMod || key.altLeftMod)) {
            this.moveTime(key.up, key.shiftLeftMod, key.altLeftMod);
            return true;
        }

        if ((key.down || key.up) && !key.metaMod) {
            this.moveCaretUpDown(key.up);
            return true;
        }
        return false;
    }

    collapse(parents:HTMLElement[]) {
        if (parents.some(
                    parent=>parent.classList.contains('audio') || parent.classList.contains('thumb') || parent.tagName == 'svg')) {
            return;
        }
        var line = this.lines[this.sel.line];
        if (!line.mayHide && !line.collapsibleCount) {
            return;
        }
        for (var i = this.sel.line; i < this.lines.length; i++) {
            var line = this.lines[i];
            if (line.collapsibleCount) {
                var collapseLine = line;
                break;
            }
        }
        if (collapseLine) {
            var hidden = !collapseLine.collapsed;
            for (var j = i - 1; j >= i - collapseLine.collapsibleCount; j--) {
                this.lines[j].hidden = hidden;
                //console.log({collapseLine, hidden, i, j, line: this.lines[j]});
            }
            collapseLine.collapsed = hidden;
            this.stopPlay();
            this.clearAudioSelection();
            this.forceUpdate();
        }
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
                this.sel.line = line;
                this.sel.lang = lang === void 0 ? 'en' : lang;
                this.sel.pos = pos === void 0 ? 0 : pos;
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

    prepareData(linesStore:LinesStore) {
        console.log("preparedata");

        this.lines = linesStore.data.map((line, i)=> {
                var en = this.parse(line.lang.en && line.lang.en.text);
                var ru = this.parse(line.lang.ru && line.lang.ru.text);
                var lineView = this.lines ? this.lines.filter(lineView=>lineView.model == line).pop() : null;
                return new LineView(line, en, ru, lineView);
            }
        );
        //this.sync();
        this.generatePath();
        this.prepareHideLines();
        //this.syncAudioLines();
    }

    parse(str:string) {
        var regexp = /([\s.]*?([-–—][ \t]+)?[\wа-яА-Я'\`]+[^\s]*)/g;
        var m:RegExpExecArray;
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

    createLinesUntil(array:LineView[], k:number) {
        for (var i = array.length; i <= k; i++) {
            array.push(new LineView(new Line(new LangItem(), new LangItem()), [], []));
        }
    }

    sync() {
        var lines = <LineView[]>[];
        var enLines = <LangItem[]>[];
        var ruLines = <LangItem[]>[];

        var lastUsedLineEn = -1;
        var lastUsedLineRu = -1;

        //for (var i = 0; i < linesStore.data.length; i++) {
        linesStore.data.forEach(model => {
            var lng = model.lang;
            if (lng.en && lng.en.start) {
                enLines.push(lng.en);
                var enMiddle = (lng.en.start + (lng.en.end - lng.en.start) / 2) / 100 / this.lineDuration;
                var k = Math.max(Math.round(enMiddle), lastUsedLineEn + 1);
                lastUsedLineEn = k;
                this.createLinesUntil(lines, k);

                if (lines[k].model.isEmpty()) {
                    var lineView = this.lines ? this.lines.filter(lineView=>lineView.model == model).pop() : null;
                    lines[k] = new LineView(model, [], [], lineView);
                }

                lines[k].model.lang.en = lng.en;
            }
            if (lng.ru && lng.ru.start) {
                ruLines.push(lng.ru);
                var ruMiddle = (lng.ru.start + (lng.ru.end - lng.ru.start) / 2) / 100 / this.lineDuration;
                var k = Math.max(Math.round(ruMiddle), lastUsedLineRu + 1);
                lastUsedLineRu = k;
                this.createLinesUntil(lines, k);
                lines[k].model.lang.ru = lng.ru;

                if (lines[k].model.isEmpty()) {
                    var lineView = this.lines ? this.lines.filter(lineView=>lineView.model == model).pop() : null;
                    lines[k] = new LineView(model, [], [], lineView);
                }
                lines[k].words.ru = this.parse(lng.ru && lng.ru.text);
            }
        });
        this.lines = lines;
    }

    getThumbPos(time:number) {
        //var time = this.fromVisibleToTime(i);
        var width = 100; //243
        var height = this.lineHeight;//100;
        var rounded = 0;//i % 2 * 50;
        //i = (i / 2 | 0) * 2;
        return `${(-time % 20) * width}px ${(-time / 20 | 0) * height - rounded}px`;
    }

    keyDownGlobal(e:KeyboardEvent) {
        var key = new KeyPress(e);
        if (this.keyManager(key)) {
            e.preventDefault();
        }
    }

    mouseClick(e:MouseEvent) {
        var parents = this.getParents(<HTMLElement>e.target);
        var selectedLine = this.getSelectionOnClick(parents);
        if (selectedLine) {
            this.collapse(parents);
            this.forceUpdate();
        }
        //this.clickHandler(<HTMLElement>e.target);
    }

    mouseDown(e:MouseEvent) {
        this.selectStart(e);
    }

    mouseMoveGlobal(e:MouseEvent) {
        this.selectMove(e);
    }

    mouseUpGlobal(e:MouseEvent) {
        this.selectEnd(e);
    }

    forceUpdate() {
        setTimeout(()=>super.forceUpdate());
    }

    componentDidUpdate() {
        this.updateCursor();
    }

    componentDidMount() {
        this.el = <HTMLElement>React.findDOMNode(this);
        this.offsetTop = this.el.offsetTop;
        this.updateCursor();
        this.el.addEventListener('click', e => this.mouseClick(e));
        this.el.addEventListener('mousedown', e => this.mouseDown(e));
        document.addEventListener('mouseup', e => this.mouseUpGlobal(e));
        document.addEventListener('mousemove', e => this.mouseMoveGlobal(e));
        document.addEventListener("keydown", e => this.keyDownGlobal(e));
    }

    render() {
        this.prepareData(linesStore);
        return div({className: 'editor'},
            div({className: 'panel'},
                React.DOM.button({onClick: ()=>this.hideEmptyLines()}, 'Hide')
            ),
            div({className: 'relative'},
                div({className: 'audio-selection audio', ref: 'audioSelectionEl'}),
                div({className: 'current-time audio', ref: 'currentTime'})
            ),
            this.lines.map(
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
                                backgroundPosition: 0 + 'px ' + -i * this.lineHeight + 'px',
                                backgroundSize: `${this.audioWidth}px ${this.audioHeight}px`
                            }
                        }),
                        React.DOM.svg({width: this.svgWidth, height: this.lineHeight},
                            line.path.map(path=>React.DOM.path({
                                onClick: ()=> this.play(path.i),
                                //onMouseEnter: ()=>console.log("enter", j),
                                //onMouseLeave: ()=>console.log("leave", j),
                                stroke: "transparent",
                                d: path.path,
                                fill: 'hsla(' + (this.lines[path.i].model.lang.en.start / 10 | 0) + ', 50%,60%, 1)'
                            }))),
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