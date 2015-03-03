module ag {
    class TextPiece {
        constructor(public value:string, public selected = false) {

        }
    }

    class Selection {
        constructor(public line:number, public pos:number, public lang:string) {

        }
    }

    function smoo1thScroll(stopY) {
        var startY = window.pageYOffset;
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        if (distance < 100) {
            scrollTo(0, stopY); return;
        }
        var speed = Math.round(distance / 100);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }
    }

    function smoothScroll(target, duration) {
        console.log("scrollto", target);

        target = Math.round(target);
        duration = Math.round(duration);
        if (duration === 0) {
            window.scrollTo(0, target);
            return Promise.resolve();
        }
        var start_time = Date.now();
        var end_time = start_time + duration;
        var start_top = window.pageYOffset;
        var distance = target - start_top;

        function smooth_step(start, end, point) {
            if (point <= start) { return 0; }
            if (point >= end) { return 1; }
            var x = (point - start) / (end - start); // interpolation
            return x * x * (3 - 2 * x);
        }

        return new Promise(function (resolve, reject) {
            var previous_top = window.pageYOffset;

            function scroll_frame() {
                if (window.pageYOffset != previous_top) {
                    reject("interrupted");
                    return;
                }
                var now = Date.now();
                var point = smooth_step(start_time, end_time, now);

                var frameTop = Math.round(start_top + (distance * point));
                //element.scrollTop = frameTop;
                console.log("window.scrollTo(0, frameTop);", frameTop   );

                window.scrollTo(0, frameTop);
                if (now >= end_time) {
                    resolve();
                    return;
                }
                if (window.pageYOffset === previous_top
                    && window.pageYOffset !== frameTop) {
                    resolve();
                    return;
                }
                previous_top = window.pageYOffset;
                setTimeout(scroll_frame, 0);
            }

            setTimeout(scroll_frame, 0);
        });
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
        sel = new Selection(0, 0, 'en');

        left = -1;

        constructor() {
            super(null, null);
        }

        componentDidMount(node:HTMLElement) {
            var el = React.findDOMNode(this);
            el.addEventListener('click', (e) => {
                var node = <HTMLElement>e.target;
                if (node.tagName === 'SPAN'){
                    var langEl = <HTMLElement>node.parentNode;
                    this.sel.lang = langEl.dataset['lang'];
                    var lineEl = <HTMLElement>langEl.parentNode;
                    this.sel.line = +lineEl.dataset['line'];
                    var arr = Array.prototype.slice.call(langEl.querySelectorAll('span'));
                    this.sel.pos = arr.indexOf(node);
                    //e.preventDefault();
                    this.forceUpdate();
                }
            });

            document.addEventListener("keydown", (e:KeyboardEvent) => {
                //e.preventDefault();
                var key = new Key(e);
                if (key.left && this.sel.pos > 0) {
                    this.sel.pos--;
                    this.left = -1;
                    e.preventDefault();
                    this.forceUpdate();
                }

                var lineLen = this.lines[this.sel.line][this.sel.lang].words.length;
                if (key.right && this.sel.pos < lineLen - 1) {
                    this.sel.pos++;
                    this.left = -1;
                    e.preventDefault();
                    this.forceUpdate();
                }

                if (key.enter) {
                    //linesStore.splice(this.currentSelection.line, 0, new Line(new Text(), new Text()));
                    linesStore[linesStore.length] = new Line(new Text(0, 0, ''), new Text(0, 0, ''));
                    for (var i = linesStore.length - 1; i >= this.sel.line; i--) {
                        var line = linesStore[i];
                        linesStore[i + 1][this.sel.lang] = linesStore[i][this.sel.lang];
                    }
                    var firstText = '';
                    var nextText = this.lines[this.sel.line][this.sel.lang].text;
                    if (!key.shiftMod) {
                        for (var i = 0; i < this.sel.pos; i++) {
                            firstText += this.lines[this.sel.line][this.sel.lang].words[i].value;
                        }
                        var nextText = '';
                        for (var i = this.sel.pos; i < this.lines[this.sel.line][this.sel.lang].words.length; i++) {
                            nextText += this.lines[this.sel.line][this.sel.lang].words[i].value;
                        }
                    }
                    var nextT = linesStore[this.sel.line + 1][this.sel.lang];
                    nextT.text = nextText;
                    linesStore[this.sel.line][this.sel.lang] = new Text(nextT.start, nextT.end, firstText);

                    linesStore.length++;
                    this.sel.line++;
                    this.sel.pos = 0;
                    e.preventDefault();
                    this.forceUpdate();
                }

                if (key.backspace) {
                    linesStore[this.sel.line - 1][this.sel.lang].text += ' ' + linesStore[this.sel.line][this.sel.lang].text;
                    for (var i = this.sel.line + 1; i < linesStore.length - 1; i++) {
                        var line = linesStore[i];
                        linesStore[i - 1][this.sel.lang] = linesStore[i][this.sel.lang];
                    }
                    linesStore[linesStore.length - 1][this.sel.lang] = new Text(0, 0, '');

                    var prevLine = this.lines[this.sel.line - 1][this.sel.lang];
                    if (prevLine.words.length === 1 && prevLine.words[0].value.trim() === '') {
                        this.sel.pos = 0;
                    }
                    else {
                        this.sel.pos = prevLine.words.length;
                    }
                    this.sel.line--;
                    e.preventDefault();
                    this.forceUpdate();
                }

                if ((key.down || key.up) && !key.metaMod) {
                    var spaces = document.querySelectorAll('[data-line="' + this.sel.line + '"] .' + this.sel.lang + ' span');
                    var space = <HTMLElement>spaces[this.sel.pos];
                    if (space) {
                        var up = document.body.scrollTop;
                        var wH = window.innerHeight;
                        var bottom = up + window.innerHeight;
                        var offsetTop = space.offsetTop;


                        if (this.left == -1) {
                            this.left = space.offsetLeft;
                        }

                        var closest = -1;
                        var closestDiff = Infinity;
                        var currLang = this.sel.lang;
                        var currLine = this.sel.line;
                        if (this.sel.lang == 'en') {
                            if (key.up) {
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
                            if (key.down) {
                                this.sel.line++;
                            }
                        }

                        console.log(currLang, currLine, this.sel);

                        var nextSpaces = document.querySelectorAll('[data-line="' + this.sel.line + '"] .' + this.sel.lang + ' span');
                        var nextFirstSpace = <HTMLElement>nextSpaces[0];
                        for (var i = 0; i < nextSpaces.length; i++) {
                            var sp = nextSpaces[i];
                            var diff = Math.abs(this.left - (<HTMLElement>sp).offsetLeft);
                            if (diff < closestDiff) {
                                closestDiff = diff;
                                closest = i;
                            }
                        }


                        if (key.up && offsetTop < up + 70) {
                            window.scrollTo(0,  up - offsetTop + nextFirstSpace.offsetTop);
                            //smoothScroll(offsetTop - wH + 100);
                            //smoothScroll(document.body, offsetTop - wH, 500);
                        }
                        if (key.down && offsetTop > bottom - 70) {
                            window.scrollTo(0, up + nextFirstSpace.offsetTop - offsetTop);
                            //smoothScroll(offsetTop - 30);
                            //smoothScroll(offsetTop - 100, 500);
                        }
                        console.log("offsetTop", offsetTop, "up", up, "bottom", bottom);


                        if (closest > -1) {
                            //this.currentSelection.line += (key.down ? 1 : -1);
                            this.sel.pos = closest;
                        }
                    }
                    e.preventDefault();
                    this.forceUpdate();
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
                        div({className: 'line', 'data-line': i},
                            div({className: 'en lng', 'data-lang': 'en'},
                                line.en.words.map((block)=>
                                        span({
                                            className: cx({
                                                selected: block.selected
                                            })
                                        }, block.value)
                                )
                            ),
                            div({className: 'ru lng', 'data-lang': 'ru'},
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