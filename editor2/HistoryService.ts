module ag {

    export class LineChange {
        line:number;
        prevText:string;
        nextText:string;

        constructor(line:number, prevText:string, nextText:string) {
            this.line = line;
            this.prevText = prevText;
            this.nextText = nextText;
        }
    }
    export class Cursor {
        line:number;
        pos:number
    }
    export class Change {
        lang:string;
        change:LineChange;
        insert:LineChange;
        remove:LineChange;
        cursorBefore:Cursor;
        cursorAfter:Cursor;

        constructor(lang:string,
                    change:LineChange,
                    insert:LineChange,
                    remove:LineChange,
                    cursorBefore:Cursor,
                    cursorAfter:Cursor) {
            this.lang = lang;
            this.change = change;
            this.insert = insert;
            this.remove = remove;
            this.cursorBefore = cursorBefore;
            this.cursorAfter = cursorAfter;
        }
    }
    export class HistoryService extends List<Change> {
        last() {
            return this[this.length - 1];
        }

    }

    export var historyService = new HistoryService();

}