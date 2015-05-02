function vd(tag:string):vd.Node;
function vd(tag:string, attrs:vd.Attr):vd.Node;
function vd(tag:string, ...children:vd.Children[]):vd.Node;
function vd(tag:string, attrs:vd.Attr, ...children:vd.Children[]):vd.Node;
function vd(attrs:vd.Attr, ...children:vd.Children[]):vd.Node;
function vd(attrs:vd.Attr):vd.Node;
function vd(...children:vd.Children[]):vd.Node;
function vd(...children:any[]):vd.Node {
    let tag:string;
    let attrs:vd.Attr = {};
    let events:vd.Events;
    let key:string;
    let classes:string[] = [];
    if (typeof children[0] === 'string') {
        tag = <any>children.shift();
        let chunks = tag.split('.');
        tag = chunks.shift() || 'div';
        classes = chunks;
    }
    if (typeof children[0] === 'object' && children[0].children === void 0 && children[0].tag === void 0) {
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
        if (attrs.data) {
            let keys = Object.keys(attrs.data);
            for (key of keys) {
                attrs['data-' + key] = attrs.data[key];
            }
            attrs.data = void 0;
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
        let newAttrs:vd.Attr = {};
        for (let key of keys) {
            if (attrs[key] !== void 0) {
                newAttrs[key] = attrs[key];
            }
        }
        attrs = newAttrs;
    }
    attrs.class = classes.join(' ');
    return new vd.Node(tag, attrs, key, events, children);
}
module vd {
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

    export class Node {
        constructor(public tag:string,
                    public attrs:Attr,
                    public key:string,
                    public events:Events,
                    public children:Children[]) {

        }
    }

    type Children0 = Node | string;
    type Children1 = Children0 | Children0[];
    type Children2 = Children1 | Children1[];
    type Children3 = Children2 | Children2[];
    export type Children = Children3 | Children3[];
    export type Attr = {
        id?: string;
        class?: string;
        style?: {[index:string]:string | number};
        events?: Events;
        data?: {[index:string]:string | number | boolean};
        key?: string;
        classes?: {[index:string]: boolean};
        [index:string]:any;
    };

    export function render(fn:()=>vd.Node) {
        var oldNode:vd.Node;
        var newNode:vd.Node;
        return new Observer2(()=> {
            newNode = fn();
            if (oldNode) {
                cito.vdom.update(oldNode, newNode);
            }
            else {
                cito.vdom.create(newNode);
            }
            oldNode = newNode;
        });

    }

}
declare module cito.vdom {
    export function create(newNode:vd.Node):void;

    export function update(oldNode:vd.Node, newNode:vd.Node):void;

    export function append(dom:Node, newNode:vd.Node):void;
}

class NFF {
    @observe content = 'hello';
    node:vd.Node;

    constructor() {
        vd.render(()=>this.render());
    }

    render() {
        return this.node = vd('div', this.content);
    }
}

var f = new NFF;
cito.vdom.append(document.body, f.node);