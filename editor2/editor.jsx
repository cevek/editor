'use strict';
class Editor{

        componentDidMount(node:HTMLElement) {
            document.addEventListener("keydown", (e) => {
                //e.preventDefault();
                var key = new Key(e);
                if (key.down) {
                    var spaces = document.querySelectorAll('[data-line="' + this.sel.line + '"] .' + this.sel.lang + ' .space');
                    var space = spaces[this.sel.pos.get()];
                    if (space) {
                        console.log(space);
                        var left = (<HTMLElement>space).offsetLeft;

                        var closest = -1;
                        var closestDiff = Infinity;
                        var nextSpaces = document.querySelectorAll('[data-line="' + (this.currentSelection.line.get() + 1) + '"] .' + this.currentSelection.lang.get() + ' .space');
                        for (var i = 0; i < nextSpaces.length; i++) {
                            var sp = nextSpaces[i];
                            var diff = Math.abs(left - (<HTMLElement>sp).offsetLeft);
                            if (diff < closestDiff) {
                                closest = i;
                            }
                        }
                        if (closest > -1) {
                            this.sel.line.set(this.sel.line.get() + 1);
                            this.currentSelection.pos.set(closest);
                        }
                    }
                    e.preventDefault();
                }
            });
        }

        parse(str:string, lineN:number) {
            var regexp = /(([-–—][ \t]+)?\w+[^\s]+)(\s+)?/g;
            var m = [];
            var pos = 0;
            var selected = this.currentSelection.line.get() === lineN && pos === this.currentSelection.pos.get();
            var block = [new TextPiece('space', m[3], selected)];
            while (m = regexp.exec(str)) {
                block.push(new TextPiece('word', m[1]));
                if (m[3]) {
                    pos++;
                    var selected = this.currentSelection.line.get() === lineN && pos === this.currentSelection.pos.get();
                    block.push(new TextPiece('space', m[3], selected));
                }
            }
            return block;
        }

        render() {
            return ();
        }
}