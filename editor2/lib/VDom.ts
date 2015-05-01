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
        [name: string]: ((e:Event)=>any);
        click?:((e:MouseEvent)=>any);
        mousedown?:((e:MouseEvent)=>any);
        mouseup?:((e:MouseEvent)=>any);
        mouseenter?:((e:MouseEvent)=>any);
        mouseleave?:((e:MouseEvent)=>any);
        mousemove?:((e:MouseEvent)=>any);
        keydown?:((e:KeyboardEvent)=>any);
        keyup?:((e:KeyboardEvent)=>any);
        keypress?:((e:KeyboardEvent)=>any);
    }

    export interface INode {
        tag:string;
        attrs?:Attr;
        key?:string;
        events?:Events;
        children?:Children[];
    }

    export class Node implements INode {
        constructor(public tag:string,
                    public attrs:Attr,
                    public key:string,
                    public events:Events,
                    public children:Children[]) {

        }
    }

    type Children0 = INode | string;
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
}
