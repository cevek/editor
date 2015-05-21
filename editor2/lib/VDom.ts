module Components {
    export var attrs = 'attrs';
    export var props = 'props';
}

interface HTMLElement {
    virtualNode: VNode;
}

module virtual {
    function flatArray(array:any[]) {
        var nodes = <any[]>[];
        for (var i = 0; i < array.length; i++) {
            var child = array[i];
            if (child instanceof Array) {
                nodes = nodes.concat(flatArray(child));
            }
            else if (child !== null && child !== void 0 && typeof child !== 'boolean') {
                if (typeof child === 'number') {
                    child = child + '';
                }
                nodes.push(child);
            }
        }
        return nodes;
    }

    export function d(tag:string, attrs:Attrs):VNode;
    export function d(tag:string, ...children:Children[]):VNode;
    export function d(tag:string, attrs:Attrs, ...children:Children[]):VNode;
    export function d(attrs:Attrs, ...children:Children[]):VNode;
    export function d(...children:Children[]):VNode;
    export function d(...children:any[]) {
        let vnode:Component1<any>;
        let tag:string;
        let attrs:Attrs = {};
        let events:Events;
        let key:string;
        let classes:string[] = [];
        if (typeof children[0] === 'string') {
            tag = <any>children.shift();
            let chunks = tag.split('.');
            tag = chunks.shift() || 'div';
            classes = chunks;
        }
        children = flatArray(children);

        if (typeof children[0] === 'object' && !(children[0] instanceof Array) && children[0].children === void 0 && children[0].tag === void 0) {
            attrs = <any>children.shift();
            if (attrs.class) {
                classes.push(attrs.class);
            }

            if (attrs.events) {
                events = attrs.events;
                attrs.events = void 0;
            }
            if (attrs.key) {
                key = attrs.key;
                attrs.key = void 0;
            }
            if (attrs.classes) {
                let keys = Object.keys(attrs.classes);
                for (key of keys) {
                    if (attrs.classes[key]) {
                        classes.push(key);
                    }
                }
                attrs.classes = void 0;
            }
            if (attrs.style) {
                let keys = Object.keys(attrs.style);
                let newStyle:{[index:string]:string | number} = {};
                for (let key of keys) {
                    let kkey = key.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
                    newStyle[kkey] = attrs.style[key];
                }
                attrs.style = newStyle;
            }
            let keys = Object.keys(attrs);
            let newAttrs:Attrs = {};
            for (let key of keys) {
                if (attrs[key] !== void 0) {
                    var newKey = key.replace(/([A-Z])/g, m => '-' + m.toLowerCase());
                    newAttrs[newKey] = attrs[key];
                }
            }
            attrs = newAttrs;
        }
        if (classes.length) {
            attrs.class = classes.join(' ');
        }
        return new VNode(tag, attrs, key, events, null, children);
    }

    export interface Events {
        [name: string]: ((e:Event)=>void);
        click?:((e:MouseEvent)=>void);
        mousedown?:((e:MouseEvent)=>void);
        mouseup?:((e:MouseEvent)=>void);
        mouseenter?:((e:MouseEvent)=>void);
        mouseleave?:((e:MouseEvent)=>void);
        mousemove?:((e:MouseEvent)=>void);
        keydown?:((e:KeyboardEvent)=>void);
        keyup?:((e:KeyboardEvent)=>void);
        keypress?:((e:KeyboardEvent)=>void);
    }

    export function extend(obj:Attrs, to:Attrs):Attrs {
        if (obj && typeof obj == 'object' && to) {
            for (let i = 0, keys = Object.keys(obj); i < keys.length; i++) {
                let key = keys[i];
                to[key] = extend(obj[key], to[key]);
            }
        }
        else {
            to = obj;
        }
        return to;
    }

    export class VNode {
        public dom:HTMLElement = null;
        public domLength:number = null;

        constructor(public tag:string,
                    public attrs:Attrs,
                    public key:string,
                    public events:Events,
                    public component:Component1<any>,
                    public children:Children[]) {
        }
    }

    type Children0 = VNode | string | number;
    type Children1 = Children0 | Children0[];
    type Children2 = Children1 | Children1[];
    type Children3 = Children2 | Children2[];
    export type MiniChildren = Children3 | Children3[];
    export type Children = MiniChildren | MiniChildren[];
    export interface Attrs {
        id?: string;
        class?: string;
        style?: {[index:string]:string | number};
        events?: Events;
        key?: string;
        classes?: {[index:string]: boolean};
        [index:string]:any;
    }

    export class Attributes implements Attrs {
    [index:string]:any;
        id:string;
        class:string;
        style:{[index:string]:string | number};
        events:Events;
        key:string;
        classes:{[index:string]: boolean};

        extend(attrs:Attrs) {
            return extend(attrs, this);
        }
    }

    /* export function render(fn:()=>VNode) {
         var oldNode:VNode;
         var newNode:VNode;
         return observer.watch(()=> {
             newNode = fn();
             if (oldNode) {
                 cito.vdom.update(oldNode, newNode);
             }
             else {
                 cito.vdom.create(newNode);
             }
             console.log(newNode);

             newNode.dom.component = newNode;
             oldNode = newNode;
         });

     }*/
    export class Component1<T> {
        attrs:virtual.Attrs = {};
        props:T;
        children:MiniChildren[] = [];
        transparent = false;
        rootNode:VNode;
        watchers:observer.Listener[] = [];

        get className() {
            var name = (<string>(<any>this.constructor).name);
            return name.replace(/([A-Z]+)/g, m => '-' + m).replace(/^-+/, '').toLowerCase();
        }

        root(...children:MiniChildren[]) {

            return vd(this.className, this.attrs, children);
        }

        watch(method:()=>void) {
            var watcher = observer.watch(method, this);
            this.watchers.push(watcher);
            return watcher;
        }

        componentDidMount():void {}

        componentWillUnmount():void {}

        protected render():VNode {return null}

        runRender() {
            return this.rootNode = this.render();
        }

        private renderer() {
            var newNode = this.render();
            //(<any>cito.vdom).updateChildren(this.rootNode, newNode);
            //(<any>cito.vdom).update(this.currentVNodeState, newNode);
            //this.rootNode.children = newNode ? [newNode] : null;

            //cito.vdom.update(this.rootNode.children, newNode);
            if (!newNode) {
                newNode = new VNode('#', null, null, {}, this, ['']);
            }
            if (!newNode.events) {
                newNode.events = {};
            }
            newNode.events['$created'] = ()=>this.componentDidMount();
            newNode.events['$destroyed'] = ()=> {
                this.watchers.forEach(watcher => watcher.unSubscribe());
                this.componentWillUnmount();
            };
            newNode.component = this;

            if (this.rootNode) {
                cito.vdom.update(this.rootNode, newNode);
            }
            else {
                cito.vdom.create(newNode);
            }

            this.rootNode = newNode;
            //this.rootNode.children = [newNode];
        }

        vd(props?:T, attrs?:virtual.Attrs, ...children:MiniChildren[]) {
            this.props = props;
            this.attrs = attrs || {};
            this.children = children;
            var listener = new observer.Listener(this.renderer, this).watch();
            this.watchers.push(listener);
            return this.rootNode;
        }
    }
}

import vd = virtual.d;
import VNode = virtual.VNode;
import Children = virtual.Children;
import Component1 = virtual.Component1;
import extendAttrs = virtual.extend;

declare module cito.vdom {
    export function create(newNode:VNode):void;

    export function update(oldNode:VNode, newNode:VNode):void;

    export function append(dom:Node, newNode:VNode):void;

    export function remove(oldNode:VNode):void;
}

class NFF extends Component1<{model:string; title: string}> {

    @observe content = 'hello';

    componentDidMount():void {
        console.log("onAttached");
    }

    componentWillUnmount():void {
        console.log("onDetached");
    }

    render() {
        console.log("render");
        //var m = this.attrs.model;
        //var t = this.attrs.title;
        return vd('div', this.content);
    }
}

class FFT extends Component1<any> {
    render():VNode {
        return Math.random() > 0.5 ? new NFF().vd({model: '3r3', title: 'eweads'}) : null;
    }
}

var fft = new FFT().vd({});

cito.vdom.append(document.body, fft);
//document.body.appendChild(fft);
//var comp = fft.component;

/*
function Component(name:string) {
    return function (target:new ()=>void) {
        var proto:{[index:string]:PropertyDescriptor} = {
            createdCallback: {
                value: function createdCallback() {
                    var el = this;
                    var component:Component1<Attrs> = <any>new target();
                    var oldNode:VNode;
                    var newNode:VNode;

                    function dependencyObserver() {
                        newNode = (<any>component).render();
                        if (oldNode) {
                            cito.vdom.update(oldNode, newNode);
                        }
                        else {
                            cito.vdom.append(el, newNode);
                        }
                        component.rootNode = newNode;
                    }

                    observer.watch(dependencyObserver);
                    this.component = component;

                    var attrs = <string[]>(<any>target)[Components.attrs];
                    if (attrs) {
                        attrs.forEach(attr => {
                            this.component[attr] = el.getAttribute(attr);
                        });
                    }

                    console.log('here I am ^_^ ');
                    console.log('with content: ', this.textContent);
                }
            },
            attachedCallback: {
                value: function attachedCallback() {
                    var el = this;
                    var comp = <Component1<Attrs>>this.component;
                    if (comp.componentDidMount) {
                        comp.componentDidMount();
                    }
                    console.log('live on DOM ;-) ');
                }
            },
            detachedCallback: {
                value: function detachedCallback() {
                    var comp = <Component1<Attrs>>this.component;
                    if (comp.componentWillUnmount) {
                        comp.componentWillUnmount();
                    }
                    console.log('leaving the DOM :-( )');
                }
            },
            attributeChangedCallback: {
                value: function attributeChangedCallback(name:string, previousValue:string, value:string) {
                    var comp = <Component1<Attrs>>this.component;
                    cito.vdom.update(this.component.rootNode, this.component.runRender());
                    /!*
                                        if (comp.onAttributeChanged) {
                                            comp.onAttributeChanged(name, previousValue, value);
                                        }
                    *!/
                    this.component[name] = value;
                }
            }
        };

        (<any>document).registerElement(name, {
            prototype: Object.create(HTMLElement.prototype, proto)
        });
    }
}*/
