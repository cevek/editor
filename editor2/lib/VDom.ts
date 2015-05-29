///<reference path="Component.ts"/>

module virtual {
    export function d(tag:string, attrs:Attrs):VNode;
    export function d(tag:string, ...children:RestChildren[]):VNode;
    export function d(tag:string, attrs:Attrs, ...children:RestChildren[]):VNode;
    export function d(attrs:Attrs, ...children:RestChildren[]):VNode;
    export function d(...children:RestChildren[]):VNode;
    export function d(...children:any[]) {
        let vnode:Component;
        let tag:string;
        let attrs:Attrs = {};
        let events:Events = {};
        let key:string;
        let classes:string[] = [];
        if (typeof children[0] === 'string') {
            tag = <any>children.shift();
            let chunks = tag.split('.');
            tag = chunks.shift() || 'div';
            classes = chunks;
        }
        children = flatArray(children);

        if (children[0] && typeof children[0] === 'object' && !(children[0] instanceof Array)
            && children[0].children === void 0 && children[0].tag === void 0) {

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
                if (key[0] == 'o' && key[1] == 'n') {
                    events[key.substr(2)] = attrs[key];
                    continue;
                }
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
        return new VNode(tag, attrs, key, events, null, <Children[]>children);
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

    interface Events {[index:string]:(e:Event)=>void}

    export class VNode {
        public dom:HTMLElement = null;
        public domLength:number = null;
        public customData:any = null;

        constructor(public tag:string,
                    public attrs:Attrs,
                    public key:string,
                    public events:Events,
                    public component:Component,
                    public children:Children[],
                    public updateCallback?:(oldNode:VNode)=>void) {
        }

        mount(node:Node) {
            cito.vdom.append(node, this);
            return this.dom;
        }

    }

    export type Child = VNode | string | number;
    export type Children = Child | (Child | (Child | (Child | Child[])[])[])[];
    export type RestChildren = Children | Children[];
    export interface Attrs {
        id?: string;
        class?: string;
        style?: {[index:string]:string | number};
        events?: Events;
        key?: string;
        classes?: {[index:string]: boolean};

        onclick?:((e:MouseEvent)=>void);
        onmousedown?:((e:MouseEvent)=>void);
        onmouseup?:((e:MouseEvent)=>void);
        onmouseenter?:((e:MouseEvent)=>void);
        onmouseleave?:((e:MouseEvent)=>void);
        onmousemove?:((e:MouseEvent)=>void);
        onmousewheel?:((e:MouseWheelEvent)=>void);
        onkeydown?:((e:KeyboardEvent)=>void);
        onkeyup?:((e:KeyboardEvent)=>void);
        onkeypress?:((e:KeyboardEvent)=>void);

        [index:string]:any;
    }

    export function flatArray(array:any[]) {
        var nodes = <any[]>[];
        for (var i = 0; i < array.length; i++) {
            var child = array[i];
            if (child instanceof Array) {
                nodes = nodes.concat(flatArray(child));
            }
            else {
                if (child !== null && child !== void 0 && typeof child !== 'boolean') {
                    if (typeof child === 'number') {
                        child = child + '';
                    }
                }
                else {
                    child = d();
                }
                nodes.push(child);
            }
        }
        return nodes;
    }
}
import vd = virtual.d;

declare module cito.vdom {
    export function create(newNode:virtual.VNode):void;

    export function update(oldNode:virtual.VNode, newNode:virtual.VNode):void;

    export function append(dom:Node, newNode:virtual.VNode):void;

    export function remove(oldNode:virtual.VNode):void;
}
