module editor {
    export const enum AudioSelectionState{PLAYING, STOPPED, PAUSED}
    export class AudioSelection {
        @observe start = 0;
        @observe end = 0;
        @observe status = AudioSelectionState.STOPPED;
        player = new AudioPlayer(this.model);

        constructor(public model:Model) {}

        clear() {
            this.status = AudioSelectionState.STOPPED;
            this.start = 0;
            this.end = 0;
        }

        play(start:number, end:number, playGaps = false) {
            this.start = start;
            this.end = end;
            this.status = AudioSelectionState.PLAYING;
            if (playGaps) {
                this.player.playRaw(this.start, this.end);
            }
            else {
                this.player.play(this.start, this.end);
            }
        }

        playCurrent() {
            this.status = AudioSelectionState.PLAYING;
            this.player.play(this.start, this.end);
        }

        stop() {
            this.status = AudioSelectionState.STOPPED;
            this.player.stopPlay();
        }
    }
}