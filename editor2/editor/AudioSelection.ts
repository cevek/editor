module editor {
    export class AudioSelection {
        start = 0;
        end = 0;
        selecting = false;
        selectionStart = 0;
        player = new AudioPlayer(this.model);

        constructor(private model:Model,
                    private events:Events,
                    private offsetTop:number,
                    private audioSelectionEl:HTMLElement,
                    private currentTime:HTMLElement) {

            events.play.listen(()=>this.play());
            events.stop.listen(()=>this.stop());
            events.updateAudioSelection.listen(()=>this.update(false));
            events.mouseClick.listen(e => this.selectStart(e));

            document.addEventListener('mousemove', e => this.selectMove(e));
            document.addEventListener('mouseup', e => this.selectEnd(e));
        }

        selectStart(e:MouseEvent) {
            if ((<HTMLElement>e.target).classList.contains('audio')) {
                this.selecting = true;
                this.start = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                this.selectionStart = this.start;
                this.end = this.start;
                this.update(false);
                e.preventDefault();
            }
        }

        selectMove(e:MouseEvent) {
            if (this.selecting) {
                var end = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                if (end <= this.selectionStart) {
                    this.start = end;
                    this.end = this.selectionStart;
                }
                else {
                    this.start = this.selectionStart;
                    this.end = end;
                }
                this.update(false);
            }
        }

        selectEnd(e:MouseEvent) {
            if (this.selecting) {
                this.selecting = false;
                this.play();
            }
        }

        clear() {
            this.start = 0;
            this.end = 0;
            this.update(false);
        }

        update(startCurrentTime:boolean) {
            var el = (<HTMLElement>React.findDOMNode(this.audioSelectionEl));
            var start = this.model.timeToVisibleLineN(this.start);
            var end = this.model.timeToVisibleLineN(this.end);
            var dur = (this.end - this.start);
            el.style.top = start + 'px';
            el.style.height = (end - start) + 'px';
            if (startCurrentTime) {
                this.currentTime.style.transition = '';
                this.currentTime.style.transform = `translateY(${start}px)`;
                //noinspection BadExpressionStatementJS
                this.currentTime.offsetHeight; //force reflow
                this.currentTime.style.transition = 'all linear';
                this.currentTime.style.transform = `translateY(${end}px)`;
                this.currentTime.style.transitionDuration = dur / config.audioRate + 's';
            }
        }

        stopCurrentTime() {
            this.currentTime.style.transition = '';
        }

        playLine(i:number) {
            var start = this.model.lines[i].model.lang.en.start / 100;
            var end = this.model.lines[i].model.lang.en.end / 100;
            this.start = start;
            this.end = end;
            this.play();
        }

        play() {
            this.update(true);
            this.player.play(this.start, this.end);
        }

        stop() {
            this.player.stopPlay();
            this.stopCurrentTime();
        }
    }
}