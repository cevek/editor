module editor {

    export class WordSelection {
        line = 0;
        pos = 0;
        lang = 'en';
        leftOffset = -1;
    }

    export class LineView {

        model:Line;
        words:{[index: string]: string[]; en: string[]; ru: string[]};
        hidden = false;
        mayHide = false;
        collapsibleCount = 0;
        collapsed = false;
        path:{i: number; path:string; top: number; height: number;}[];

        constructor(model:Line, en:string[], ru:string[], oldLine?:LineView) {
            this.model = model;
            this.words = {en: en, ru: ru};
            if (oldLine) {
                this.hidden = oldLine.hidden;
                this.mayHide = oldLine.mayHide;
                this.collapsed = oldLine.collapsed;
                this.collapsibleCount = oldLine.collapsibleCount;
                this.path = oldLine.path;
            }
        }
    }

    export class Model {
        lines:LineView[];
        sel = new WordSelection();
        audioSelection = new AudioSelection(this);
        historyService = new HistoryService();


        collapsedLines:{[index:number]:{collapsed: boolean; length: number}} = {};

        undo() {
            var change = this.historyService.back();
            if (change) {
                this.sel.line = change.cursorBefore.line;
                this.sel.pos = change.cursorBefore.pos;
                this.sel.leftOffset = -1;
                this.sel.lang = change.lang;
            }
        }

        redo() {
            var change = this.historyService.forward();
            if (change) {
                this.sel.line = change.cursorAfter.line;
                this.sel.pos = change.cursorAfter.pos;
                this.sel.leftOffset = -1;
                this.sel.lang = change.lang;
            }
        }

        fromVisibleToTime(top:number) {
            var k = 0;
            var top = top / config.lineHeight;
            for (var i = 0; i < this.lines.length; i++) {
                var line = this.lines[i];
                if (!line.hidden) {
                    if (top < k + 1) {
                        return (i + top - k) * config.lineDuration;
                    }
                    k++;
                }
            }
            return 0;
        }

        timeToVisibleLineN(time:number) {
            var k = 0;
            var lineN = time / config.lineDuration;
            for (var i = 0; i < this.lines.length; i++) {
                var line = this.lines[i];
                //console.log({i, k, time, hidden: line.hidden});
                if (i == Math.floor(lineN)) {
                    return (k + (line.hidden ? 0 : lineN % 1)) * config.lineHeight;
                }
                if (!line.hidden) {
                    k++;
                }
            }
            return 0;
        }

        showAllLines() {
            this.lines.forEach(line => line.hidden = false);
        }

        prepareHideLines() {

            var collapsed = 0;
            var start:number = null;
            this.lines.forEach((line, i) => {
                if (line.model.isEmpty()) {
                    if (start == null) {
                        start = i - 1;
                    }
                    collapsed++;
                }
                else {
                    if (collapsed > 0) {
                        this.collapsedLines[start + 1] = {collapsed: false, length: collapsed};
                    }
                    start = null;
                    collapsed = 0;
                }
            });
            console.log(this.collapsedLines);
        }

        prepareData(linesStore:LinesStore) {
            this.lines = linesStore.data.map((line, i)=> {
                    var en = this.parse(line.lang.en && line.lang.en.text);
                    var ru = this.parse(line.lang.ru && line.lang.ru.text);
                    var lineView = this.lines ? this.lines.filter(lineView=>lineView.model == line).pop() : null;
                    return new LineView(line, en, ru, lineView);
                }
            );
            //this.sync();
            //this.syncAudioLines();
        }

        parse(str:string) {
            var regexp = /([\s.]*?([-–—][ \t]+)?[\wа-яА-Я']+[^\s]*)/g;
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
                    var enMiddle = (lng.en.start + (lng.en.end - lng.en.start) / 2) / 100 / config.lineDuration;
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
                    var ruMiddle = (lng.ru.start + (lng.ru.end - lng.ru.start) / 2) / 100 / config.lineDuration;
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
    }
}