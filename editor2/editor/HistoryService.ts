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
class HistoryService {
    private data:Change[] = [];
    private index = 0;

    add(change:Change) {
        if (this.data.length > this.index) {
            this.data.splice(this.index);
        }
        this.data.push(change);
        this.index++;
    }

    forward():Change {
        if (this.index < this.data.length) {
            this.index++;
            return this.data[this.index - 1];
        }
        return null;
    }

    back():Change {
        if (this.index > 0) {
            this.index--;

            return this.data[this.index];
        }
        return null;
    }

}
