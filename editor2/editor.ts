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

        parseSrt(subtitle:string) {
            var re = /\d+\s+(-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3}) --> (-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s+([\S\s]*?)(?=\d+\s+-?\d{2}:\d{2}:\d{2}|$)/g;
            var res;
            var subs = [];
            while (res = re.exec(subtitle)) {
                var start = (res[1] ? -1 : 1) * (res[2] * 360000 + res[3] * 6000 + res[4] * 100 + res[5] / 10 | 0);
                var end = (res[6] ? -1 : 1) * (res[7] * 360000 + res[8] * 6000 + res[9] * 100 + res[10] / 10 | 0);
                var text = res[11].trim();
                subs.push(new Text(start, end, text));
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



