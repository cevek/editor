module control {
    export class Popup extends virtual.Component<{}> {
        closeWhenClickOut = true;
        closeButton = true;
        hasOpacity = true;
        styled = true;
        header:virtual.VNode;
        body:virtual.VNode;
        footer:virtual.VNode;
        target:Node;

        mainLeft = 0;
        mainTop = 0;

        static show(popup:Popup) {
            popup.init({}).mount(document.body);

            return popup;
        }

        close() {
            document.body.classList.remove('remove-scroll');
            this.rootNode.dom.parentNode.removeChild(this.rootNode.dom);
            this.removeBodyPadding();
        }

        show() {
            this.setBodyPaddingRight();
            document.body.classList.add('remove-scroll');
        }

        private oldPaddingRight = '';

        private setBodyPaddingRight() {
            this.oldPaddingRight = document.body.style.paddingRight;
            var computed = window.getComputedStyle(document.body);
            document.body.style.paddingRight = parseInt(computed.paddingRight, 10) + (window.innerWidth - this.rootNode.dom.offsetWidth) + 'px';
        }

        private removeBodyPadding() {
            document.body.style.paddingRight = this.oldPaddingRight;
        }

        protected clickOutside(e:Event) {
            if (this.closeWhenClickOut && e.target == this.rootNode.dom) {
                this.close();
            }
        }

        componentWillMount() {
            //todo:test for all browsers
            if (this.target) {
                var rect = (<Element>this.target).getBoundingClientRect();
                this.mainLeft = rect.left;
                this.mainTop = rect.bottom;
            }
        }

        componentDidMount() {
            this.show();
        }

        render() {
            return this.rootWithAttrs({
                    class: 'popup',
                    classes: {
                        styled: this.styled,
                        opacity: this.hasOpacity
                    },
                    onclick: (e)=>this.clickOutside(e)
                },
                vd('.popup-main', {
                        style: {
                            float: this.target ? 'left' : '',
                            position: 'relative',
                            left: this.mainLeft + 'px',
                            top: this.mainTop + 'px',
                        }
                    },
                    this.closeButton ? vd('span.close-button', {onclick: ()=>this.close()}, '×') : null,
                    this.header ? vd('.header', this.header) : null,
                    this.body ? vd('.main', this.body) : null,
                    this.footer ? vd('.footer', this.footer) : null
                )
            );
        }
    }

    export class Tip extends virtual.Component<{}> {
        constructor(public target:virtual.VNode,
                    public notCloseOnClick:virtual.VNode[],
                    public onClose:()=>void) {
            super();
        }

        componentDidMount() {
            var targetRect = (<Element>this.target.dom).getBoundingClientRect();
            var srcRect = (<Element>this.rootNode.dom).getBoundingClientRect();
            this.rootNode.dom.style.marginLeft = targetRect.left - srcRect.left + 'px';
            this.rootNode.dom.style.marginTop = targetRect.bottom - srcRect.top + 'px';
            var clickCallback = (e:MouseEvent) => {
                var node = <Node>e.target;
                var parents = [node];
                while (node = node.parentNode) {
                    parents.push(node);
                }
                var otherTargets = this.notCloseOnClick || [];
                if (parents.indexOf(this.rootNode.dom) === -1 && otherTargets.every(
                            t => parents.indexOf(t.dom) === -1)) {
                    this.onClose();
                }
            };
            (<any>this.rootNode.dom).clickCallback = clickCallback;
            document.addEventListener('click', clickCallback);
        }

        componentWillUnmount() {
            document.removeEventListener('click', (<any>this.rootNode.dom).clickCallback);
        }

        render() {
            return this.rootWithAttrs({style: {position: 'absolute', d1isplay: 'block'}}, this.children);
        }
    }
}