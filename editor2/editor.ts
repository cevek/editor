interface ILang<T> {[lang:string]:T;en:T;ru:T;}
class ALine<T> {
    lang:ILang<T>;

    constructor(en:T, ru:T) {
        this.lang = {en: null, ru: null};
        this.lang.en = en;
        this.lang.ru = ru;
    }
}
class Line extends ALine<TextLine> {}

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

        this.sync2();
    }

    private _removeLine(line:number, lang:string) {
        for (var i = line + 1; i < this.length; i++) {
            this[i - 1][lang] = this[i][lang];
        }
        this[this.length - 1][lang] = new TextLine();
        if (this.lastLineIsEmpty('en') && this.lastLineIsEmpty('ru')) {
            this.pop();
        }
    }

    private _insertLine(line:number, lang:string, textLine:TextLine) {
        this[this.length] = new Line(new TextLine(), new TextLine());
        this.length++;
        for (var i = this.length - 2; i >= line; i--) {
            this[i + 1][lang] = this[i][lang];
        }
        this[line][lang] = textLine;
        if (this.lastLineIsEmpty('en') && this.lastLineIsEmpty('ru')) {
            this.pop();
        }
    }

    removeLine(append:boolean, line:number, lang:string) {
        if (line < 0 || line >= this.length || (append && line === 0)) {
            return null;
        }

        var prevText2 = this[line][lang].text;

        if (append) {
            var prevText1 = this[line - 1][lang].text;
            this[line - 1][lang].text += ' ' + this[line][lang].text.trim();
            var change = new LineChange(line - 1, prevText1, this[line - 1][lang].text);
        }
        this._removeLine(line, lang);
        if (append) {
            this._insertLine(line, lang, new TextLine());
        }

        return {
            change: change,
            insert: null,
            remove: new LineChange(line, prevText2, '')
        };
    }

    insertLine(cut:boolean, cutPos:number, line:number, lang:string, pos:number) {
        var currText = this[line][lang];
        var prevText = currText.text;
        var firstText = currText.text.substr(0, cutPos);
        var nextText = currText.text.substr(cutPos);
        currText.text = firstText;
        this._insertLine(line + 1, lang, new TextLine({start: currText.start, end: currText.end, text: nextText}));

        //remove next empty line if exists
        for (var i = line + 1; i < this.length - 1; i++) {
            if (this[i][lang].isEmpty()) {
                var removedLine = new LineChange(i - 1, '', '');
                this._removeLine(i, lang);
                break;
            }
        }

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
            this._removeLine(change.insert.line, lang);
        }
        if (change.remove) {
            var insertLine = new TextLine({start: 0, end: 0, text: change.remove.prevText});
            this._insertLine(change.remove.line, lang, insertLine);
        }
    }

    redo(change:Change) {
        var lang = change.lang;
        if (change.change) {
            this[change.change.line][lang].text = change.change.nextText;
        }
        if (change.remove) {
            this._removeLine(change.remove.line, lang);
        }
        if (change.insert) {
            var insertLine = new TextLine({start: 0, end: 0, text: change.insert.nextText});
            this._insertLine(change.insert.line, lang, insertLine);
        }
    }

    parseSrt(subtitle:string) {
        var shift = 240700;
        var re = /\d+\s+(-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3}) --> (-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s+([\S\s]*?)(?=\d+\s+-?\d{2}:\d{2}:\d{2}|$)/g;
        var res;
        var subs = [];
        while (res = re.exec(subtitle)) {
            var start = (res[1] ? -1 : 1) * (res[2] * 360000 + res[3] * 6000 + res[4] * 100 + res[5] / 10 | 0);
            var end = (res[6] ? -1 : 1) * (res[7] * 360000 + res[8] * 6000 + res[9] * 100 + res[10] / 10 | 0);
            start = start - shift;
            end = end - shift;
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
            if (this[i].lang.en && this[i].lang.en.start) {
                enLines.push(this[i].lang.en);
            }
            if (this[i].lang.ru && this[i].lang.ru.start) {
                ruLines.push(this[i].lang.ru);
            }
        }

        var lastEnLine:TextLine;
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

            for (var k = startJ; k < j - 1; k++) {
                var ruLine2 = ruLines[k];
                //console.log("insert empty ru", k);
                var line = new Line(new TextLine(), ruLine2);
                lines.push(line);
            }

            if (ruLine) {
                //console.log("insert ru", j);
            }

            if (lastEnLine) {
                while (true) {
                    if ((lines.length) * 50 > enLine.start / 100 * 50) {
                        break;
                    }
                    var line = new Line(new TextLine(), new TextLine());
                    lines.push(line);
                }
            }
            lastEnLine = enLine;
            var line = new Line(enLine, ruLine || new TextLine());
            lines.push(line);
        }

        for (var k = j; k < ruLines.length; k++) {
            var ruLine2 = ruLines[k];
            var line = new Line(new TextLine(), ruLine2);
            lines.push(line);
        }

        this.replace(lines);
        /*


        //tests
                var insertEn = 0;
                var insertRu = 0;
                var dupsRu = [];
                var dubsRuCount = 0;
                for (var i = 0; i < this.length; i++) {
                    var line = this[i];
                    if (!line.en.isEmpty()) {
                        insertEn++;
                    }
                    if (!line.ru.isEmpty()) {
                        if (dupsRu.indexOf(line.ru) > -1) {
                            console.log("dup ru", line.ru);
                            dubsRuCount++;
                        }
                        dupsRu.push(line.ru);
                        insertRu++;
                    }
                }
                console.log(enLines.length, insertEn, ruLines.length, insertRu, dubsRuCount);
                console.log(ruLines);
        */

    }

    createLinesUntil(k:number) {
        for (var i = this.length; i <= k; i++) {
            this.push(new Line(new TextLine(), new TextLine()));
        }
    }

    sync2() {
        var lines = new LinesStore();
        var enLines = <TextLine[]>[];
        var ruLines = <TextLine[]>[];

        var lastUsedLineEn = -1;
        var lastUsedLineRu = -1;

        for (var i = 0; i < this.length; i++) {
            if (this[i].lang.en && this[i].lang.en.start) {
                enLines.push(this[i].lang.en);
                var enMiddle = (this[i].lang.en.start + (this[i].lang.en.end - this[i].lang.en.start) / 2) / 100;
                var k = Math.max(Math.round(enMiddle), lastUsedLineEn + 1);
                lastUsedLineEn = k;
                lines.createLinesUntil(k);
                lines[k].lang.en = this[i].lang.en;
            }
            if (this[i].lang.ru && this[i].lang.ru.start) {
                ruLines.push(this[i].lang.ru);
                var ruMiddle = (this[i].lang.ru.start + (this[i].lang.ru.end - this[i].lang.ru.start) / 2) / 100;
                var k = Math.max(Math.round(ruMiddle), lastUsedLineRu + 1);
                lastUsedLineRu = k;
                lines.createLinesUntil(k);
                lines[k].lang.ru = this[i].lang.ru;
            }
        }
        this.replace(lines);
    }

    lastLineIsEmpty(lang) {
        var line = this[this.length - 1];
        return line[lang].isEmpty();
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



