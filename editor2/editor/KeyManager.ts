module editor {
    export const enum Action{
        UNDO,
        REDO,
        INSERT_LINE,
        APPEND_LINE,
        REMOVE_LINE,
        MOVE_TIME,
        MOVE_CARET,
        LEFT,
        DOWN,
        UP,
        RIGHT,
        PLAY,
        STOP,
        UPDATE_AUDIO_SELECTION,
        LINKED_NEGATE
    }

    export class KeyManager {
        constructor(private eventEmitter:EventEmitter<Action>) {}

        keyManager(key:KeyboardKey) {
            if (key.noMod) {
                if (key.up) {
                    this.eventEmitter.emit(Action.UP);
                }
                if (key.down) {
                    this.eventEmitter.emit(Action.DOWN);
                }
                if (key.left) {
                    this.eventEmitter.emit(Action.LEFT);
                }
                if (key.right) {
                    this.eventEmitter.emit(Action.RIGHT);
                }
                return true;
            }
            if ((key.left || key.right) && key.noMod) {
                this.eventEmitter.emit(key.left ? Action.LEFT : Action.RIGHT);
                return true;
            }

            if (key.z && key.metaMod && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.eventEmitter.emit(Action.UNDO);
                return true;
            }

            if (key.z && key.metaMod && key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.eventEmitter.emit(Action.REDO);
                return true;
            }

            if (key.enter && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.eventEmitter.emit(Action.INSERT_LINE);
                return true;
            }

            if (key.enter && key.shiftMod && !key.altMod && !key.ctrlMod && !key.metaMod) {
                this.eventEmitter.emit(Action.LINKED_NEGATE);
                return true;
            }

            if (key.space && key.noMod) {
                this.eventEmitter.emit(Action.LINKED_NEGATE);
                return true;
            }

            if (key.tab && key.noMod) {
                this.eventEmitter.emit(Action.PLAY);
                return true;
            }

            if (key.backspace && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.eventEmitter.emit(key.metaMod ? Action.REMOVE_LINE : Action.APPEND_LINE);
                return true;
            }

            return false;
        }
    }
}