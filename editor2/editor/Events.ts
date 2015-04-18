module editor {
    export class Events {
        undo = new EventEmitter;
        redo = new EventEmitter;
        insertLine = new EventEmitter;
        appendLine = new EventEmitter;
        removeLine = new EventEmitter;
        left = new EventEmitter;
        down = new EventEmitter;
        up = new EventEmitter;
        right = new EventEmitter;
        play = new EventEmitter;
        stop = new EventEmitter;
        updateAudioSelection = new EventEmitter;
        linkedNegate = new EventEmitter
    }
}