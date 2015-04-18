module editor {
    export class Path {
        secondHeight = config.lineHeight / config.lineDuration;

        constructor(private model:Model) {}

        pathGenerator(topLeft:number, leftHeight:number, topRight:number, rightHeight:number, width:number) {
            topLeft = Math.round(topLeft);
            leftHeight = Math.round(leftHeight);
            topRight = Math.round(topRight);
            rightHeight = Math.round(rightHeight);
            width = Math.round(width);
            var bx = width / 2 | 0;
            var path = '';

            path += 'M0,' + topLeft + ' ';

            path += 'C' + bx + ',' + topLeft + ' ';
            path += bx + ',' + topRight + ' ';
            path += width + ',' + topRight + ' ';

            path += 'L' + width + ',' + (topRight + rightHeight) + ' ';

            path += 'C' + bx + ',' + (topRight + rightHeight) + ' ';
            path += bx + ',' + (topLeft + leftHeight) + ' ';
            path += '0,' + (topLeft + leftHeight) + 'Z';
            return path;
        }

        generatePath() {
            var lines = this.model.lines;
            for (var i = 0; i < lines.length; i++) {
                lines[i].path = [];
                lines[i].haveCrossedPath = false;
                lines.forEach((line, j)=> {
                    if (line.model.lang.en.start) {
                        var end = line.model.lang.en.end / 100;
                        var start = line.model.lang.en.start / 100;
                        var dur = (end - start);
                        var lineHeight = config.lineHeight;
                        var leftTop = (start * this.secondHeight - lineHeight * i) | 0;
                        var leftHeight = dur * this.secondHeight | 0;
                        var rightTop = (j - i) * lineHeight;
                        var min = leftTop < rightTop ? leftTop : rightTop;
                        var max = (leftTop + leftHeight) > (rightTop + lineHeight)
                            ? leftTop + leftHeight
                            : rightTop + lineHeight;

                        var margin = 0;
                        if (min < -margin && -margin < max || min < lineHeight + margin && lineHeight + margin < max) {
                            lines[i].haveCrossedPath = true;
                            lines[i].path.push({
                                i: j,
                                top: leftTop,
                                height: leftHeight,
                                path: this.pathGenerator(leftTop, leftHeight, rightTop, lineHeight, config.svgWidth)
                            });
                        }
                    }
                });
            }
        }

        resizeTime(e:MouseEvent, i:number, pos:Pos) {
            console.log({e, i, pos});
        }

        resizeTimeMove(e:MouseEvent) {

        }

        resizeTimeEnd(e:MouseEvent) {

        }

        moveTime(isUp:boolean, isStartTime:boolean, isEndTime:boolean) {
            var t = 30;
            var line = this.model.lines[this.model.sel.line];
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

    }
}