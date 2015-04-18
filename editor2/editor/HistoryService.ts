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
    cursorBefore:Cursor;
    cursorAfter:Cursor;
    insertLang:number;
    removeLang:number;
    insertLine:number;
    removeLine:number;
    line:number;
    pos:number;
    lang:string;
    command:string;
    append:boolean;
}
interface IHistoryService {[n: number]: Change}
class HistoryService extends List<Change> implements IHistoryService {
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
