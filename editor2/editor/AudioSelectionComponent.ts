module editor {
    export class AudioSelectionComponent extends React.Component<{model:Model; events:Events;},any> {

        selecting = false;
        selectionStart = 0;
        player = new AudioPlayer(this.model);
        currentTime:HTMLElement;
        el:HTMLElement;

        offsetTop = 0;
        startY = 0;
        endY = 0;

        model = this.props.model;
        audioSelection = this.props.model.audioSelection;
        events = this.props.events;

        selectStart(e:MouseEvent) {
            if ((<HTMLElement>e.target).classList.contains('audio')) {
                this.selecting = true;
                this.audioSelection.start = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                this.selectionStart = this.audioSelection.start;
                this.audioSelection.end = this.audioSelection.start;
                e.preventDefault();
                this.stopCurrentTime();
                this.audioSelection.stop();
                this.forceUpdate();
            }
        }

        selectMove(e:MouseEvent) {
            if (this.selecting) {
                var end = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                if (end <= this.selectionStart) {
                    this.audioSelection.start = end;
                    this.audioSelection.end = this.selectionStart;
                }
                else {
                    this.audioSelection.start = this.selectionStart;
                    this.audioSelection.end = end;
                }
                this.forceUpdate();
            }
        }

        selectEnd(e:MouseEvent) {
            if (this.selecting) {
                this.selecting = false;
                this.audioSelection.playCurrent();
                this.startCurrentTime();
                this.forceUpdate();
            }
        }

        clear() {
            this.audioSelection.start = 0;
            this.audioSelection.end = 0;
        }

        startCurrentTime() {
            var dur = (this.audioSelection.end - this.audioSelection.start);
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
/*
            new Observer2(() => {
                var status = this.audioSelection.status;
                if (status == AudioSelectionState.PLAYING) {
                    this.startCurrentTime();
                }
                if (status == AudioSelectionState.STOPPED) {
                    this.stopCurrentTime();
                }
                this.forceUpdate();
            });
            new Observer2(() => {
                this.startY = this.model.timeToVisibleLineN(this.audioSelection.start);
                this.endY = this.model.timeToVisibleLineN(this.audioSelection.end);
                this.forceUpdate();
            });

*/
            this.el = <HTMLElement>React.findDOMNode(this.refs['audioSelection']);
            this.currentTime = <HTMLElement>React.findDOMNode(this.refs['currentTime']);
            this.offsetTop = (<HTMLElement>this.el.parentNode).offsetTop;

            this.props.events.mouseDown.listen(e => this.selectStart(e));
            document.addEventListener('mousemove', e => this.selectMove(e));
            document.addEventListener('mouseup', e => this.selectEnd(e));

        }

        render() {
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

        audioSelectionNode:virtual.VNode;
        currentTimeNode:virtual.VNode;

        render2() {
            return vd('.relative',
                this.audioSelectionNode =
                    vd('.audio-selection.audio', {
                        styles: {
                            top: `${this.startY}px`,
                            height: `${this.endY - this.startY}px`
                        },
                    }),
                this.currentTimeNode =
                    vd('.current-time.audio')
            )
        }
    }
}