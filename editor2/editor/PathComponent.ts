module editor {
    export class PathComponent extends React.Component<{model:Model; lineN:number;},any> {

        path = '';
        marginTop = 0;
        marginBottom = 0;
        height = 0;
        handleHeight = 20;
        halfHandlHeight = this.handleHeight / 2;
        handleWidth = 20;
        bottom = 0;
        top = 0;
        resizeKoef = 2;


        selecting = false;
        selectionStartY = 0;
        selectionStartTime = 0;
        isSelectionStartTime = false;
        //constructor(private model:Model) {}

        playLine(i:number) {
            var start = this.props.model.lines[i].model.lang.en.start / 100;
            var end = this.props.model.lines[i].model.lang.en.end / 100;
            this.props.model.audioSelection.play(start, end);
        }

        static pathGenerator(topLeft:number, bottomLeft:number, topRight:number, bottomRight:number, width:number) {
            var bx = width / 2;
            var path = '';

            path += 'M0,' + topLeft + ' ';

            path += 'C' + bx + ',' + topLeft + ' ';
            path += bx + ',' + topRight + ' ';
            path += width + ',' + topRight + ' ';

            path += 'L' + width + ',' + bottomRight + ' ';

            path += 'C' + bx + ',' + bottomRight + ' ';
            path += bx + ',' + bottomLeft + ' ';
            path += '0,' + bottomLeft + 'Z';
            return path;
        }

        makePath() {
            var lineHeight = config.lineHeight;
            var secondHeight = lineHeight / config.lineDuration;

            var line = this.props.model.lines[this.props.lineN];
            var end = line.model.lang.en.end / 100;
            var start = line.model.lang.en.start / 100;
            if (start) {
                var dur = (end - start);
                var leftTop = (start * secondHeight - lineHeight * this.props.lineN);
                var leftBottom = leftTop + dur * secondHeight;
                var rightTop = 0;
                var rightBottom = rightTop + lineHeight;
                var min = leftTop < rightTop ? leftTop : rightTop;
                var max = leftBottom > rightBottom ? leftBottom : rightBottom;
                min -= this.halfHandlHeight;
                max += this.halfHandlHeight;
                var marginTop = 0;
                if (min < 0) {
                    marginTop = -min;
                }
                this.height = max + marginTop;
                this.marginTop = marginTop;
                this.marginBottom = this.height > lineHeight ? this.height - lineHeight : 0;
                this.top = leftTop + marginTop;
                this.bottom = leftBottom + marginTop;
                this.path = PathComponent.pathGenerator(this.top, this.bottom, rightTop + marginTop, rightBottom + marginTop, config.svgWidth);
                return true;
            }
            return false;
        }

        resizeTime(e:MouseEvent, isStartTime:boolean) {
            var lang = this.props.model.lines[this.props.lineN].model.lang.en;
            this.selecting = true;
            this.selectionStartTime = isStartTime ? lang.start : lang.end;
            this.selectionStartY = e.pageY;
            this.isSelectionStartTime = isStartTime;
            document.body.classList.add('resize-ns');
            e.preventDefault();
        }

        resizeTimeMove(e:MouseEvent) {
            if (this.selecting) {
                var lang = this.props.model.lines[this.props.lineN].model.lang.en;
                var diff = e.pageY - this.selectionStartY;
                if (this.isSelectionStartTime) {
                    lang.start = this.selectionStartTime + diff * this.resizeKoef;
                }
                else {
                    lang.end = this.selectionStartTime + diff * this.resizeKoef;
                }
                this.forceUpdate();
                e.preventDefault();
            }
        }

        resizeTimeEnd(e:MouseEvent) {
            if (this.selecting) {
                this.selecting = false;
                document.body.classList.remove('resize-ns');
                var lang = this.props.model.lines[this.props.lineN].model.lang.en;
                this.props.model.audioSelection.play(lang.start / 100, lang.end / 100);
            }
        }

        moveTime(isUp:boolean, isStartTime:boolean, isEndTime:boolean) {
            var t = 30;
            var line = this.props.model.lines[this.props.model.sel.line];
            if (line.model.lang.en.start) {
                if (isStartTime) {
                    line.model.lang.en.start += isUp ? -t : t;
                }
                if (isEndTime) {
                    line.model.lang.en.end += isUp ? -t : t;
                }
                return true;
            }
            return false;
        }

        componentDidMount() {

            document.addEventListener('mousemove', e => this.resizeTimeMove(e));
            document.addEventListener('mouseup', e => this.resizeTimeEnd(e));

        }

        render() {
            if (!this.makePath()) {
                return null;
            }
            return React.DOM.svg({
                    width: config.svgWidth,
                    height: this.height,
                    style: {WebkitTransform: `translateY(-${this.marginTop}px)`}
                },
                React.DOM.path({
                    onClick: ()=> this.playLine(this.props.lineN),
                    stroke: "transparent",
                    d: this.path,
                    fill: 'hsla(' + (this.props.model.lines[this.props.lineN].model.lang.en.start / 10 | 0) + ', 50%,60%, 1)'
                }),
                React.DOM.rect(<any>{
                    onMouseDown: (e:React.MouseEvent)=>
                        this.resizeTime(<MouseEvent>e.nativeEvent, true),
                    x: 0,
                    y: this.top - this.halfHandlHeight,
                    width: 20,
                    height: 20
                }),
                React.DOM.rect(<any>{
                    onMouseDown: (e:React.MouseEvent)=>
                        this.resizeTime(<MouseEvent>e.nativeEvent, false),
                    x: 0,
                    y: this.bottom - this.halfHandlHeight,
                    width: 20,
                    height: 20
                })
            )
        }

    }
}