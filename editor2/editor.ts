interface ILine {[lang:string]:TextLine;}
class Line implements ILine {
[lang:string]:TextLine;
    en:TextLine;
    ru:TextLine;

    constructor(en:TextLine, ru:TextLine) {
        this.en = en;
        this.ru = ru;
    }
}

class TextLine {
    start:number;
    end:number;
    text:string;

    isEmpty() {
        return this.text.trim() === '';
    }

    constructor(data = {start: 0, end: 0, text: ''}) {
        this.start = data.start;
        this.end = data.end;
        this.text = data.text;
    }
}

interface ILinesStore {[n: number]: Line}
class LinesStore extends List<Line> implements ILinesStore {

    parse(en:string, ru:string) {
        var enLines = this.parseSrt(en);
        var ruLines = this.parseSrt(ru);
        var max = Math.max(enLines.length, ruLines.length);
        for (var i = 0; i < max; i++) {
            var line = new Line(enLines[i] || new TextLine(), ruLines[i] || new TextLine());
            this.push(line);
        }

        this.sync();
    }

    removeLine(append:boolean, line:number, lang:string) {
        var prevText2 = this[line][lang].text;

        if (append) {
            var prevText1 = this[line - 1][lang].text;
            this[line - 1][lang].text += ' ' + this[line][lang].text.trim();
            var change = new LineChange(line - 1, prevText1, this[line - 1][lang].text);
        }
        for (var i = line + 1; i < this.length - 1; i++) {
            this[i - 1][lang] = this[i][lang];
        }
        this[this.length - 1][lang] = new TextLine();

        return {
            change: change,
            insert: null,
            remove: new LineChange(line, prevText2, '')
        };
    }

    insertLine(cut:boolean, cutPos:number, line:number, lang:string, pos:number) {
        this[this.length] = new Line(new TextLine(), new TextLine());

        for (var i = this.length - 1; i >= line; i--) {
            this[i + 1][lang] = this[i][lang];
        }

        var removedLine = null;
        for (var i = line; i < this.length; i++) {
            if (this[i][lang].isEmpty()) {
                removedLine = new LineChange(i, '', '');
                for (var j = i + 1; j < this.length - 1; j++) {
                    this[j - 1][lang] = this[j][lang];
                }
                this[this.length - 1][lang] = new TextLine();
                break;
            }
        }

        var prevText = this[line][lang].text;
        var firstText = this[line][lang].text.substr(0, cutPos);
        var nextText = this[line][lang].text.substr(cutPos);
        var nextT = this[line + 1][lang];
        nextT.text = nextText;
        this[line][lang] = new TextLine({start: nextT.start, end: nextT.end, text: firstText});
        this.length++;
        return {
            change: new LineChange(line, prevText, firstText),
            insert: new LineChange(line + 1, '', nextText),
            remove: removedLine
        };
    }

    undo(change:Change) {
        var lang = change.lang;
        if (change.change) {
            this[change.change.line][lang].text = change.change.prevText;
        }
        if (change.insert) {
            for (var i = change.insert.line + 1; i < this.length - 1; i++) {
                this[i - 1][lang] = this[i][lang];
            }
            this[this.length - 1][lang].text = '';
        }
        if (change.remove) {
            this[this.length] = new Line(new TextLine(), new TextLine());
            for (var i = this.length - 1; i >= change.remove.line; i--) {
                this[i + 1][lang] = this[i][lang];
            }
            this[change.remove.line][lang] = new TextLine({start: 0, end: 0, text: change.remove.prevText});
        }
    }

    redo(change:Change) {
        var lang = change.lang;
        if (change.change) {
            this[change.change.line][lang].text = change.change.nextText;
        }
        if (change.remove) {
            for (var i = change.remove.line + 1; i < this.length - 1; i++) {
                this[i - 1][lang] = this[i][lang];
            }
            this[this.length - 1][lang].text = '';
        }
        if (change.insert) {
            this[this.length] = new Line(new TextLine(), new TextLine());
            for (var i = this.length - 1; i >= change.insert.line; i--) {
                this[i + 1][lang] = this[i][lang];
            }
            this[change.insert.line][lang] = new TextLine({start: 0, end: 0, text: change.insert.nextText});
        }
    }

    parseSrt(subtitle:string) {
        var re = /\d+\s+(-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3}) --> (-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s+([\S\s]*?)(?=\d+\s+-?\d{2}:\d{2}:\d{2}|$)/g;
        var res;
        var subs = [];
        while (res = re.exec(subtitle)) {
            var start = (res[1] ? -1 : 1) * (res[2] * 360000 + res[3] * 6000 + res[4] * 100 + res[5] / 10 | 0);
            var end = (res[6] ? -1 : 1) * (res[7] * 360000 + res[8] * 6000 + res[9] * 100 + res[10] / 10 | 0);
            var text = res[11].trim();
            var bb = text.split(/[-–—][\t ]+/);
            for (var i = 0; i < bb.length; i++) {
                var t = bb[i].trim();
                if (t) {
                    subs.push(new TextLine({start: start, end: end, text: t}));
                }
            }
        }
        return subs;
    }

    sync() {
        var lines = new LinesStore();
        var enLines = <TextLine[]>[];
        var ruLines = <TextLine[]>[];
        for (var i = 0; i < this.length; i++) {
            if (this[i].en && this[i].en.start) {
                enLines.push(this[i].en);
            }
            if (this[i].ru && this[i].ru.start) {
                ruLines.push(this[i].ru);
            }
        }

        for (var i = 0, j = 0; i < enLines.length; i++) {
            var enLine = enLines[i];
            var enMiddle = enLine.start + (enLine.end - enLine.start) / 2;
            var l = j;
            var startJ = j;
            var prevDiff = Infinity;
            var ruLine:TextLine = null;
            while (true) {
                ruLine = ruLines[l];
                if (!ruLine) {
                    break;
                }
                var ruMiddle = ruLine.start + (ruLine.end - ruLine.start) / 2;
                var diff = Math.abs(enMiddle - ruMiddle);
                if (diff < 1000) {
                    j = l + 1;
                    break;
                }
                if (prevDiff < diff) {
                    ruLine = null;
                    break;
                }
                prevDiff = diff;
                l++;
            }

            for (var k = startJ + 1; k < j; k++) {
                var ruLine2 = ruLines[k];
                var line = new Line(new TextLine(), ruLine2);
                lines.push(line);
            }

            var line = new Line(enLine, ruLine || new TextLine());
            lines.push(line);
        }

        for (var k = j; k < ruLines.length; k++) {
            var ruLine2 = ruLines[k];
            var line = new Line(new TextLine(), ruLine2);
            lines.push(line);
        }

        this.replace(lines);
    }
}

var linesStore = new LinesStore();
Promise.all([
    HTTP.get<string>('../data/enSub.srt', true),
    HTTP.get<string>('../data/ruSub.srt', true)
]).then((values) => {
    linesStore.parse(values[0], values[1]);
    React.render(React.createElement(EditorView), document.body);
});



