module editor {
    export class Toolbar {
        constructor(private model:Model,
                    private events:Events) {}

        hideEmptyLines() {
            this.model.lines.forEach(line => {
                if (line.collapsibleCount) {
                    line.collapsed = true;
                }
                if (line.mayHide) {
                    line.hidden = true;
                }
            });

            this.events.stop.emit();
            this.events.updateAudioSelection.emit();
        }
    }

}