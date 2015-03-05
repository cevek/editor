class LineChange {
    line:number;
    prevText:string;
    nextText:string;

    constructor(line:number, prevText:string, nextText:string) {
        this.line = line;
        this.prevText = prevText;
        this.nextText = nextText;
    }
}
class Cursor {
    line:number;
    pos:number
}
class Change {
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
class HistoryService extends List<Change> {
    private index = 0;

    add(change:Change) {
        if (this.length > this.index) {
            this.splice(this.index);
        }
        this.push(change);
        this.index++;
    }

    forward():Change {
        if (this.index < this.length) {
            this.index++;
            return this[this.index - 1];
        }
        return null;
    }

    back():Change {
        if (this.index > 0) {
            this.index--;

            return this[this.index];
        }
        return null;
    }

}

var historyService = new HistoryService();
