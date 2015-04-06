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
    audio:HTMLAudioElement;

    constructor() {
        super(null, null);
        glob.editor = this;
    }

    generatePath(i:number) {
        var timeX = 50;
        var lineHeight = 50;
        var arr:React.ReactSVGElement[] = [];
        this.lines.forEach((line, j)=> {
            if (line.model.lang.en.start) {
                var end = line.model.lang.en.end / 100;
                var start = line.model.lang.en.start / 100;
                var dur = (end - start);
                var leftTop = (start * timeX - lineHeight * i) | 0;
                var leftHeight = dur * timeX | 0;
                var rightTop = (j - i) * lineHeight;
                var min = leftTop < rightTop ? leftTop : rightTop;
                var max = (leftTop + leftHeight) > (rightTop + lineHeight) ? leftTop + leftHeight : rightTop + lineHeight;
                if (min <= 0 && 0 <= max || min <= lineHeight && lineHeight <= max) {
                    arr.push(
                        React.DOM.path({
                            onClick: ()=>this.play(j),
                            onMouseEnter: ()=>console.log("enter", j),
                            onMouseLeave: ()=>console.log("leave", j),
                            stroke: "transparent",
                            d: this.pathGenerator(leftTop, leftHeight, rightTop, lineHeight, 50),
                            fill: 'hsla(' + (start * 77 | 0) + ', 50%,60%, 1)'
                        })
                    )
                }
            }
        });
        return arr;
    }

    audioContext = new AudioContext();
    playedFrames = 0;
    playMaximumFrames = 0;

    play(i:number) {
        var start = this.lines[i].model.lang.en.start / 100;
        var end = this.lines[i].model.lang.en.end / 100;
        this.playTime(start, end);
    }

    playRawLine(i:number) {
        var start = i;
        var end = (i + 1);
        this.playTime(start, end);
    }

    playTime(start:number, end:number) {
        var audioData = linesStore.audioData;
        var rate = .85;
        if (audioData) {
            var dur = end - start;
            if (dur) {
                console.log("play", start, end, dur);

                var channel = audioData.getChannelData(0);
                var sliceChannel = channel.subarray(start * audioData.sampleRate, end * audioData.sampleRate);
                var buff = this.audioContext.createBuffer(audioData.numberOfChannels, sliceChannel.length, audioData.sampleRate);
                buff.getChannelData(0).set(sliceChannel);

                /*
                                this.playedFrames = 0;
                                this.playMaximumFrames = dur * audioData.sampleRate;
                                this.audio.play();
                                this.audio.currentTime = start;

                */
                var source = this.audioContext.createBufferSource();
                source.buffer = buff;
                source.playbackRate.value = rate;
                var currentTime = (<HTMLElement>React.findDOMNode(this.refs['currentTime']));
                currentTime.style.transition = '';
                currentTime.style.transform = `translateY(${start * 50}px)`;
                currentTime.offsetHeight; //force reflow
                currentTime.style.transition = 'all linear';
                currentTime.style.transform = `translateY(${end * 50}px)`;
                currentTime.style.transitionDuration = dur / rate + 's';

                //source.buffer = linesStore.audioData.getChannelData(0);

                source.connect(this.audioContext.destination);
                source.start(0);
                //source.stop(dur);

                /*
                        this.audio.play();
                        this.audio.currentTime = start;
                        this.audio.playbackRate = 1;
                        setTimeout(()=> {
                            this.audio.pause();
                        }, (end - start) * 1000);
                */
            }
        }
        else {
            console.log("audioData is not loaded yet");

        }
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
        this.updateCursor();
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

    forceUpdate() {
        setTimeout(()=>super.forceUpdate());
    }

    componentDidUpdate() {
        this.updateCursor();
    }

    //prepareAudio() {
    //    var el = <HTMLElement>React.findDOMNode(this);
    //    this.audio = document.createElement('audio');
    //    this.audio.src = '../data/enAudio.mp3';
    //    this.audio.controls = true;
    //    //document.body.insertBefore(this.audio, document.body.firstChild);
    //
    //    var source2 = this.audioContext.createMediaElementSource(this.audio);
    //
    //    var scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    //    scriptNode.onaudioprocess = (audioProcessingEvent) => {
    //        var inputBuffer = audioProcessingEvent.inputBuffer;
    //        var outputBuffer = audioProcessingEvent.outputBuffer;
    //        this.playedFrames += inputBuffer.length;
    //        if (this.playMaximumFrames > this.playedFrames) {
    //            this.playedFrames = 0;
    //            this.playMaximumFrames = 0;
    //            console.log("pause");
    //            //this.audio.pause();
    //        }
    //        /*
    //                            // Loop through the output channels (in this case there is only one)
    //                            for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
    //                                var inputData = inputBuffer.getChannelData(channel);
    //                                var outputData = outputBuffer.getChannelData(channel);
    //
    //                                // Loop through the 4096 samples
    //                                for (var sample = 0; sample < inputBuffer.length; sample++) {
    //                                    // make output equal to the same as the input
    //                                    outputData[sample] = inputData[sample];
    //
    //                                    // add noise to each output sample
    //                                    outputData[sample] += ((Math.random() * 2) - 1) * 0.2;
    //                                }
    //                            }*/
    //    };
    //    source2.connect(this.audioContext.destination);
    //    //scriptNode.connect(this.audioContext.destination);
    //}

    moveTime(isUp:boolean, isStartTime:boolean, isEndTime:boolean) {
        var t = 30;
        var line = this.lines[this.sel.line];
        if (isStartTime) {
            line.model.lang.en.start += isUp ? -t : t;
        }
        if (isEndTime) {
            line.model.lang.en.end += isUp ? -t : t;
        }
        this.forceUpdate();
    }

    componentDidMount() {
        var el = <HTMLElement>React.findDOMNode(this);
        this.updateCursor();
        //this.prepareAudio();

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

            if ((key.down || key.up) && (key.shiftLeftMod || key.altLeftMod)) {
                this.moveTime(key.up, key.shiftLeftMod, key.altLeftMod);
                e.preventDefault();
                return;
            }

            if ((key.down || key.up) && !key.metaMod) {
                this.moveCaretUpDown(key.up);
                e.preventDefault();
            }

        });
    }

    prepareData(linesStore:LinesStore) {
        this.lines = linesStore.data.map((line, i)=> new LineView(line,
                this.parse(line.lang.en && line.lang.en.text),
                this.parse(line.lang.ru && line.lang.ru.text)
            )
        );
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

    getThumbPos(i:number) {
        var rounded = i % 2 * 50;
        i = (i / 2 | 0) * 2;
        return `${(-i % 20) * 243}px ${(-i / 20 | 0) * 100 - rounded}px`;
    }

    render() {
        this.prepareData(linesStore);
        return div({className: 'editor'},
            div({className: 'current-time', ref: 'currentTime'}),
            this.lines.map(
                (line, i) =>
                    div({className: cx({line: true, linked: line.model.linked}), 'data-line': i},
                        div({className: 'thumb', onClick:()=>this.playRawLine(i), style: {backgroundPosition: this.getThumbPos(i)}}),
                        div({className: 'audio-en', onClick:()=>this.playRawLine(i), style: {backgroundPosition: 0 + 'px ' + -i * 50 + 'px'}}),
                        React.DOM.svg({width: 50, height: 50}, this.generatePath(i)),
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