module editor {
    export class AudioSelectionComponent extends React.Component<{model:Model; events:Events;},any> {

        selecting = false;
        selectionStart = 0;
        player = new AudioPlayer(this.props.model);
        currentTime:HTMLElement;
        el:HTMLElement;

        offsetTop = 0;
        startY = 0;
        endY = 0;

        selectStart(e:MouseEvent) {
            if ((<HTMLElement>e.target).classList.contains('audio')) {
                this.selecting = true;
                this.props.model.audioSelection.start = this.props.model.fromVisibleToTime(e.pageY - this.offsetTop);
                this.selectionStart = this.props.model.audioSelection.start;
                this.props.model.audioSelection.end = this.props.model.audioSelection.start;
                e.preventDefault();
                this.stopCurrentTime();
                this.props.model.audioSelection.stop();
                this.forceUpdate();
            }
        }

        selectMove(e:MouseEvent) {
            if (this.selecting) {
                var end = this.props.model.fromVisibleToTime(e.pageY - this.offsetTop);
                if (end <= this.selectionStart) {
                    this.props.model.audioSelection.start = end;
                    this.props.model.audioSelection.end = this.selectionStart;
                }
                else {
                    this.props.model.audioSelection.start = this.selectionStart;
                    this.props.model.audioSelection.end = end;
                }
                this.forceUpdate();
            }
        }

        selectEnd(e:MouseEvent) {
            if (this.selecting) {
                this.selecting = false;
                this.props.model.audioSelection.playCurrent();
                this.startCurrentTime();
                this.forceUpdate();
            }
        }

        clear() {
            this.props.model.audioSelection.start = 0;
            this.props.model.audioSelection.end = 0;
        }

        startCurrentTime() {
            var dur = (this.props.model.audioSelection.end - this.props.model.audioSelection.start);
            this.currentTime.style.transition = '';
            this.currentTime.style.transform = `translateY(${this.startY}px)`;
            //noinspection BadExpressionStatementJS
            this.currentTime.offsetHeight; //force reflow
            this.currentTime.style.transition = 'all linear';
            this.currentTime.style.transform = `translateY(${this.endY}px)`;
            this.currentTime.style.transitionDuration = dur / config.audioRate + 's';
        }

        stopCurrentTime() {
            this.currentTime.style.transition = '';
        }

        componentDidMount() {
            Observer(this.props.model.audioSelection.status, () => {
                var status = this.props.model.audioSelection.status;
                if (status == AudioSelectionState.PLAYING) {
                    this.startCurrentTime();
                }
                if (status == AudioSelectionState.STOPPED) {
                    this.stopCurrentTime();
                }
            });

            //this.props.events.updateAudioSelection.listen(()=>this.update(false));

            this.el = <HTMLElement>React.findDOMNode(this.refs['audioSelection']);
            this.currentTime = <HTMLElement>React.findDOMNode(this.refs['currentTime']);
            this.offsetTop = (<HTMLElement>this.el.parentNode).offsetTop;

            this.props.events.mouseDown.listen(e => this.selectStart(e));
            document.addEventListener('mousemove', e => this.selectMove(e));
            document.addEventListener('mouseup', e => this.selectEnd(e));

        }

        render() {
            this.startY = this.props.model.timeToVisibleLineN(this.props.model.audioSelection.start);
            this.endY = this.props.model.timeToVisibleLineN(this.props.model.audioSelection.end);
            return div({className: 'relative'},
                div({
                    className: 'audio-selection audio', style: {
                        top: this.startY,
                        height: this.endY - this.startY
                    },
                    ref: 'audioSelection'
                }),
                div({className: 'current-time audio', ref: 'currentTime'})
            )
        }
    }
}