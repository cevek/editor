module editor {
    export class KeyManager {
        constructor(private events:Events) {}

        keyManager(key:KeyboardKey) {
            if (key.noMod) {
                if (key.up) {
                    this.events.up.emit();
                }
                if (key.down) {
                    this.events.down.emit();
                }
                if (key.left) {
                    this.events.left.emit();
                }
                if (key.right) {
                    this.events.right.emit();
                }
                return true;
            }

            if (key.z && key.metaMod && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.undo.emit();
                return true;
            }

            if (key.z && key.metaMod && key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.redo.emit();
                return true;
            }

            if (key.enter && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.insertLine.emit();
                return true;
            }

            if (key.enter && key.shiftMod && !key.altMod && !key.ctrlMod && !key.metaMod) {
                this.events.linkedNegate.emit();
                return true;
            }

            if (key.space && key.noMod) {
                this.events.linkedNegate.emit();
                return true;
            }

            if (key.tab && key.noMod) {
                this.events.play.emit();
                return true;
            }

            if (key.backspace && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                if (key.metaMod){
                    this.events.removeLine.emit();
                }
                else {
                    this.events.appendLine.emit();
                }
                return true;
            }

            return false;
        }
    }
}