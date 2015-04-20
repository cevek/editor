module editor {
    export class Toolbar {
        constructor(private model:Model,
                    private events:Events) {}

        hideEmptyLines() {
            for (let fromLine in this.model.collapsedLines){
                var collapseLine = this.model.collapsedLines[fromLine];
                var toLine = fromLine + collapseLine.length;
                for (var i = fromLine; i < toLine; i++) {
                    this.model.lines[i].hidden = !collapseLine.collapsed;
                }
                collapseLine.collapsed = !collapseLine.collapsed;
            }
        }
    }

}