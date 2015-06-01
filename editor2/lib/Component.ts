/**
 * ------------------ The Life-Cycle of a Composite Component ------------------
 *
 * - constructor: Initialization of state. The instance is now retained.
 *   - componentWillMount
 *   - render
 *   - [children's constructors]
 *     - [children's componentWillMount and render]
 *     - [children's componentDidMount]
 *     - componentDidMount
 *
 *       Update Phases:
 *       - componentWillReceiveProps (only called if parent updated)
 *       - shouldComponentUpdate
 *         - componentWillUpdate
 *           - render
 *           - [children's constructors or receive props phases]
 *         - componentDidUpdate
 *
 *     - componentWillUnmount
 *     - [children's componentWillUnmount]
 *   - [children destroyed]
 * - (destroyed): The instance is now blank, released by React and ready for GC.
 *
 * -----------------------------------------------------------------------------
 */

module virtual {

    const enum State{CREATE, UPDATE}
    var currentState = State.CREATE;

    function updateCallback(oldNode:VNode) {
        oldNode.component.update();
    }

    export class Component<T> {
        id = ++Component.ID;
        static ID = 0;
        DESTROYED:boolean;
        REPLACED:boolean;
        props:T;
        attrs:virtual.Attrs = {};
        children:Children[] = [];
        transparent = false;
        rootNode:VCNodeRoot;
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

        updateAttrs() {}

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
                newNode = new VNode();//'#', null, null, {}, this, ['']);
                //newNode.tag = '#';
            }
            if (!newNode.events) {
                newNode.events = {};
            }
            newNode.events['$created'] = ()=>this.componentDidMount();
            newNode.events['$destroyed'] = ()=> this.componentWillUnmount();
            newNode.component = this;

            if (this.rootNode) {
                /*
                                if (this.rootNode.children !== newNode.children) {
                                    this.destroyChildren(this.rootNode.children);
                                }
                */
                if (this.rootNode.dom) {
                    cito.vdom.update(this.rootNode, newNode);
                }
            }
            else {
                this.rootNode = new VCNodeRoot();
            }
            if (this.DESTROYED) {
                return;
            }
            this.rootNode.replaceWith(newNode);
        }

        init(props:T, attrs?:virtual.Attrs, ...children:Child[]):VNode;
        init(props:T, ...children:Child[]):VNode;
        init(props:T, ...children:any[]) {
            if (children[0] && typeof children[0] === 'object' && !(children[0] instanceof Array)
                && children[0].children === void 0 && children[0].tag === void 0) {
                this.attrs = children.shift();
            }
            if (!this.attrs) {
                this.attrs = {};
            }
            this.props = props;
            this.children = children;
            this.updateAttrs();
            this.componentWillMount();
            var watcher = new observer.Watcher(this.update, this).watch();
            this.watchers.push(watcher);
            return this.rootNode;
        }
    }
}
//import vc = virtual.vc;
