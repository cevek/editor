module control {
    export class Popup extends virtual.Component {
        closeWhenClickOut = true;
        hasOpacity = true;
        header:virtual.VNode;
        body:virtual.VNode;
        footer:virtual.VNode;

        static show(popup: Popup){
            popup.init().mount(document.body);
            return popup;
        }

        remove() {
            document.body.classList.remove('remove-scroll');
            this.rootNode.dom.parentNode.removeChild(this.rootNode.dom);
            this.removeBodyPadding();
        }

        show() {
            //this.rootNode.mount(document.body);
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
                this.remove();
            }
        }

        componentDidMount() {
            this.show();
        }

        render() {
            return this.rootWithAttrs({class: 'popup', events: {click: (e)=>this.clickOutside(e)}},
                vd('.popup-main',
                    this.header ? vd('.header', this.header) : null,
                    this.body ? vd('.main', this.body) : null,
                    this.footer ? vd('.footer', this.footer) : null
                )
            );
        }
    }
}