module ag {
    export class Line {
    [lang:string]:Text;
        constructor(public en:Text, public ru:Text) {}
    }

    export class Text {
        duration:number;

        constructor(public start:number, public end:number, public text:string) {
            this.duration = end - start;
        }
    }

    export class LinesStore extends List<Line> {

        parse(en:string, ru:string) {
            var enLines = this.parseSrt(en);
            var ruLines = this.parseSrt(ru);
            var max = Math.max(enLines.length, ruLines.length);
            for (var i = 0; i < max; i++) {
                var line = new Line(enLines[i] || new Text(0, 0, ''), ruLines[i] || new Text(0, 0, ''));
                this.push(line);
            }
        }

        removeLine(append:boolean, line:number, lang:string) {
            if (append) {
                this[line - 1][lang].text += ' ' + this[line][lang].text.trim();
            }
            for (var i = line + 1; i < this.length - 1; i++) {
                this[i - 1][lang] = this[i][lang];
            }
            this[this.length - 1][lang] = new Text(0, 0, '');
        }

        insertLine(cut:boolean, cutPos:number, line:number, lang:string, pos:number) {
            this[this.length] = new Line(new Text(0, 0, ''), new Text(0, 0, ''));
            for (var i = this.length - 1; i >= line; i--) {
                this[i + 1][lang] = this[i][lang];
            }
            var firstText = this[line][lang].text.substr(0, cutPos);
            var nextText = this[line][lang].text.substr(cutPos);
            var nextT = this[line + 1][lang];
            nextT.text = nextText;
            this[line][lang] = new Text(nextT.start, nextT.end, firstText);
            this.length++;
        }

        undo(change:Change) {
            this[change.change.line][change.lang].text = change.change.prevText;
            if (change.insert) {
                for (var i = change.insert.line + 1; i < this.length - 1; i++) {
                    this[i - 1][change.lang] = this[i][change.lang];
                }
                this[this.length - 1][change.lang].text = '';
            }
            if (change.remove) {
                this[this.length] = new Line(new Text(0, 0, ''), new Text(0, 0, ''));
                for (var i = this.length - 1; i >= change.remove.line; i--) {
                    this[i + 1][change.lang] = this[i][change.lang];
                }
                this[change.remove.line][change.lang] = new Text(0, 0, change.remove.prevText);
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
                        subs.push(new Text(start, end, t));
                    }
                }
            }
            return subs;
        }
    }

    export var linesStore = new LinesStore();
    Promise.all([
        HTTP.get<string>('../data/enSub.srt', true),
        HTTP.get<string>('../data/ruSub.srt', true)
    ]).then((values) => {
        linesStore.parse(values[0], values[1]);
        React.render(React.createElement(EditorView), document.body);
    });
}



