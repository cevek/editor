interface ILang {[lang:string]:LangItem;en:LangItem;ru:LangItem;}
class Line {
    lang:ILang;
    linked = false;

    constructor(en = new LangItem, ru = new LangItem) {
        this.lang = {en: en, ru: ru};
    }

    isEmpty() {
        return this.lang.en.isEmpty() && this.lang.ru.isEmpty()
    }
}

class LangItem {
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

var glob:any = {};
class LinesStore {
    data:Line[] = [];
    shiftTime = 5037.3;
    audioData:AudioBuffer;
    audioSource:AudioBufferSourceNode;

    add(v:Line) {
        this.data.push(v);
    }

    insert(pos:number, line:Line) {
        return this.data.splice(pos, 0, line);
    }

    remove(pos:number) {
        return this.data.splice(pos, 1);
    }

    replace(array:Line[]) {
        this.data = array;
    }

    parse(en:string, ru:string) {
        var enLines = this.parseSrt(en);
        var ruLines = this.parseSrt(ru);
        var max = Math.max(enLines.length, ruLines.length);
        for (var i = 0; i < max; i++) {
            var line = new Line(enLines[i] || new LangItem(), ruLines[i] || new LangItem());
            this.add(line);
        }
        this.sync2();
    }

    removeLine(append:boolean, line:number, lang:string) {
        if (line < 0 || line >= this.data.length || (append && line === 0)) {
            return null;
        }

        var change = new Change();
        change.command = 'remove';
        change.lang = lang;
        change.line = line;
        change.append = append;

        var firstLinked = this._firstLinked(line);

        var thisLine = this.data[line];
        var prevText2 = thisLine.lang[lang].text;
        change.pos = prevText2.length;

        if (!thisLine.linked && append) {
            var prevLine = this.data[line - 1];
            if (prevLine.lang[lang].isEmpty()) {
                prevLine.lang[lang] = thisLine.lang[lang];
            }
            else {
                prevLine.lang[lang].text += ' ' + prevText2.trim();
                prevLine.lang[lang].end = thisLine.lang[lang].end;
            }
            thisLine.lang[lang] = new LangItem();
        }
        else {
            change.removeLang = firstLinked;
            this.rm(line, firstLinked, lang);
        }
        if (this.data[firstLinked - 1].isEmpty()) {
            change.removeLine = firstLinked - 1;
            this.remove(firstLinked - 1);
            if (append) {
                var ln = line === firstLinked ? firstLinked : firstLinked - 1;
                change.insertLine = ln;
                this.insert(ln, new Line());
            }
        }
        return change;
    }

    rm(line:number, firstLinked:number, lang:string) {
        for (var i = line + 1; i < firstLinked; i++) {
            this.data[i - 1].lang[lang] = this.data[i].lang[lang];
        }
        if (line < firstLinked) {
            this.data[firstLinked - 1].lang[lang] = new LangItem();
        }
    }

    negateRm(line:number, firstLinked:number, lang:string) {

    }

    _firstLinked(line:number) {
        var firstLinked = this.data.length;
        for (var i = line; i < this.data.length - 1; i++) {
            if (this.data[i].linked) {
                firstLinked = i;
                break;
            }
        }
        return firstLinked;
    }

    insertLine(cutPos:number, line:number, lang:string) {
        var realEnd = 0;
        if (cutPos === 0) {
            var currText = new LangItem();
            var nextText = '';
        }
        else {
            var currText = this.data[line].lang[lang];
            var firstText = currText.text.substr(0, cutPos);
            var nextText = currText.text.substr(cutPos);
            currText.text = firstText;
            realEnd = currText.end;
            currText.end = currText.start + (currText.end - currText.start) / 2;
            line++;
        }

        var textLine = new LangItem({
            start: currText.end,
            end: realEnd,
            text: nextText
        });
        var en = lang == 'en' ? textLine : new LangItem();
        var ru = lang == 'ru' ? textLine : new LangItem();
        //var negateLang = lang == 'en' ? 'ru' : 'en';

        var firstLinked = this._firstLinked(line);
        var nextEmptyLine = this.data.length;
        for (var i = line; i < this.data.length - 1; i++) {
            if (this.data[i].lang[lang].isEmpty()) {
                nextEmptyLine = i;
                break;
            }
        }

        var change = new Change;
        change.lang = lang;
        change.line = line;
        change.pos = cutPos;
        change.command = "insert";

        if (nextEmptyLine < firstLinked) {
            this.ins(nextEmptyLine + 1, line, lang, textLine);
            change.insertLang = nextEmptyLine;
        }
        else {
            change.removeLine = firstLinked;
            this.insert(firstLinked, new Line());
            firstLinked++;
            change.insertLang = firstLinked;
            this.ins(firstLinked, line, lang, textLine);
            for (var i = firstLinked + 1; i < this.data.length; i++) {
                if (this.data[i].isEmpty()) {
                    change.removeLine = i;
                    this.remove(i);
                    break;
                }
            }
        }
        return change;
    }

    ins(from:number, line:number, lang:string, textLine:LangItem) {
        for (var i = from - 2; i >= line; i--) {
            this.data[i + 1].lang[lang] = this.data[i].lang[lang];
        }
        this.data[line].lang[lang] = textLine;
    }

    negateIns() {

    }

    undo(change:Change) {
        var line = 0;
        var pos = 0;
        var lang = 'en';

        var currLine = this.data[line];
        var nextLine = this.data[line + 1];
        if (nextLine.isEmpty()) {
            currLine.lang[lang].text += nextLine.lang[lang].text;
        }
    }

    redo(change:Change) {
    }

    parseSrt(subtitle:string) {
        var shift = this.shiftTime * 100;
        var re = /\d+\s+(-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3}) --> (-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s+([\S\s]*?)(?=\d+\s+-?\d{2}:\d{2}:\d{2}|$)/g;
        var res:RegExpExecArray;
        var subs = <LangItem[]>[];
        while (res = re.exec(subtitle)) {
            var start = (res[1] ? -1 : 1) * (+res[2] * 360000 + +res[3] * 6000 + +res[4] * 100 + +res[5] / 10 | 0);
            var end = (res[6] ? -1 : 1) * (+res[7] * 360000 + +res[8] * 6000 + +res[9] * 100 + +res[10] / 10 | 0);
            start = start - shift;
            end = end - shift;
            var text = res[11].trim();
            var bb = text.split(/[-–—][\t ]+/);
            for (var i = 0; i < bb.length; i++) {
                var t = bb[i].trim();
                if (t) {
                    subs.push(new LangItem({start: start, end: end, text: t}));
                }
            }
        }
        return subs;
    }

    /*
        sync() {
            var lines = new LinesStore();
            var enLines = <LangItem[]>[];
            var ruLines = <LangItem[]>[];

            for (var i = 0; i < this.length; i++) {
                if (this[i].lang.en && this[i].lang.en.start) {
                    enLines.push(this[i].lang.en);
                }
                if (this[i].lang.ru && this[i].lang.ru.start) {
                    ruLines.push(this[i].lang.ru);
                }
            }

            var lastEnLine:LangItem;
            for (var i = 0, j = 0; i < enLines.length; i++) {
                var enLine = enLines[i];
                var enMiddle = enLine.start + (enLine.end - enLine.start) / 2;
                var l = j;
                var startJ = j;
                var prevDiff = Infinity;
                var ruLine:LangItem = null;
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
                    var line = new Line(new LangItem(), ruLine2);
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
                        var line = new Line(new LangItem(), new LangItem());
                        lines.push(line);
                    }
                }
                lastEnLine = enLine;
                var line = new Line(enLine, ruLine || new LangItem());
                lines.push(line);
            }

            for (var k = j; k < ruLines.length; k++) {
                var ruLine2 = ruLines[k];
                var line = new Line(new LangItem(), ruLine2);
                lines.push(line);
            }

            this.replace(lines);
            /!*


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
            *!/

        }
    */

    createLinesUntil(array:Line[], k:number) {
        for (var i = array.length; i <= k; i++) {
            array.push(new Line(new LangItem(), new LangItem()));
        }
    }

    sync2() {
        var lines = <Line[]>[];
        var enLines = <LangItem[]>[];
        var ruLines = <LangItem[]>[];

        var lastUsedLineEn = -1;
        var lastUsedLineRu = -1;

        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].lang.en && this.data[i].lang.en.start) {
                enLines.push(this.data[i].lang.en);
                var enMiddle = (this.data[i].lang.en.start + (this.data[i].lang.en.end - this.data[i].lang.en.start) / 2) / 100 / 2;
                var k = Math.max(Math.round(enMiddle), lastUsedLineEn + 1);
                lastUsedLineEn = k;
                this.createLinesUntil(lines, k);
                lines[k].lang.en = this.data[i].lang.en;
            }
            if (this.data[i].lang.ru && this.data[i].lang.ru.start) {
                ruLines.push(this.data[i].lang.ru);
                var ruMiddle = (this.data[i].lang.ru.start + (this.data[i].lang.ru.end - this.data[i].lang.ru.start) / 2) / 100 / 2;
                var k = Math.max(Math.round(ruMiddle), lastUsedLineRu + 1);
                lastUsedLineRu = k;
                this.createLinesUntil(lines, k);
                lines[k].lang.ru = this.data[i].lang.ru;
            }
        }
        this.replace(lines);
    }
}

