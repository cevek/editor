module virtual {
    export class Component {
        attrs:virtual.Attrs = {};
        children:Children[] = [];
        transparent = false;
        rootNode:VNode;
        watchers:observer.Watcher[] = [];
        nnode:Node;

        componentName() {
            var name = (<string>(<any>this.constructor).name);
            return name.replace(/([A-Z]+)/g, m => '-' + m).replace(/^-+/, '').toLowerCase();
        }

        root(...children:RestChildren[]) {
            return vd(this.componentName(), this.attrs, <Children[]>children);
        }

        rootWithAttrs(attrs:Attrs, ...children:RestChildren[]) {
            return vd(this.componentName(), extend(attrs, this.attrs), <Children[]>children);
        }

        watch(method:()=>void) {
            var watcher = new observer.Watcher(method, this).watch();
            this.watchers.push(watcher);
            return watcher;
        }

        componentDidMount():void {}

        componentWillUnmount():void {}

        componentWillMount():void {}

        destructor() {
            this.watchers.forEach(watcher => watcher.unsubscribe());
        }

        render():VNode {return null}

        private destroyChildren(children:Children[]) {
            for (var child of children) {
                if (child instanceof Array) {
                    this.destroyChildren(child);
                }
                else {
                    if (child && child instanceof VNode && child.component) {
                        child.component.destructor();
                    }
                }
            }
        }

        update() {
            var newNode = this.render();

            if (!newNode) {
                newNode = new VNode('#', null, null, {}, this, ['']);
            }
            if (!newNode.events) {
                newNode.events = {};
            }
            newNode.events['$created'] = ()=>this.componentDidMount();
            newNode.events['$destroyed'] = ()=> this.componentWillUnmount();
            newNode.component = this;

            if (this.rootNode) {
                if (this.rootNode.children !== newNode.children) {
                    this.destroyChildren(this.rootNode.children);
                }
                if (this.rootNode.dom) {
                    cito.vdom.update(this.rootNode, newNode);
                }
                this.rootNode.attrs = newNode.attrs;
                this.rootNode.children = newNode.children;
                this.rootNode.component = newNode.component;
                this.rootNode.events = newNode.events;
                this.rootNode.key = newNode.key;
                this.rootNode.tag = newNode.tag;
            }
            else {
                this.rootNode = newNode;
            }
        }

        init(attrs?:virtual.Attrs, ...children:Child[]):VNode;
        init(...children:Child[]):VNode;
        init(...children:any[]) {
            if (children[0] && typeof children[0] === 'object' && !(children[0] instanceof Array)
                && children[0].children === void 0 && children[0].tag === void 0) {
                this.attrs = children.shift();
            }
            if (!this.attrs) {
                this.attrs = {};
            }
            this.children = children;
            this.componentWillMount();
            var watcher = new observer.Watcher(this.update, this).watch();
            this.watchers.push(watcher);
            return this.rootNode;
        }
    }
}