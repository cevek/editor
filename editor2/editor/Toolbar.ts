module editor {
    export class Toolbar {
        constructor(private model:Model,
                    private eventEmitter:EventEmitter<Action>) {}

        hideEmptyLines() {
            this.model.lines.forEach(line => {
                if (line.collapsibleCount) {
                    line.collapsed = true;
                }
                if (line.mayHide) {
                    line.hidden = true;
                }
            });

            this.eventEmitter.emit(Action.STOP);
            this.eventEmitter.emit(Action.UPDATE_AUDIO_SELECTION);
        }
    }

}