var __observe_stack:Atom<any>[] = [];

var Sym = (<any>window).Symbol || function (name:string) {return '__' + name};
var globalObserver = Sym("observer");
var globalListeners = Sym("listeners");

function observe(obj:any, key:string) {
    Object.defineProperty(obj, key, {
        enumerable: true,
        get: function get() {
            if (!this[globalObserver]) {
                this[globalObserver] = {};
            }
            var atom = <Atom<any>>this[globalObserver][key];
            if (!this[globalObserver][key]) {
                atom = new Atom(this, key);
                this[globalObserver][key] = atom;
            }
            __observe_stack.push(atom);
            return atom.value;
        },
        set: function set(val:any) {
            if (!this[globalObserver]) {
                this[globalObserver] = {};
            }
            var atom = <Atom<any>>this[globalObserver][key];
            if (!this[globalObserver][key]) {
                atom = new Atom(this, key, val);
                this[globalObserver][key] = atom;
            }
            atom.value = val;
            if (atom.listeners) {
                var keys = Object.keys(atom.listeners);
                for (var i = 0; i < keys.length; i++) {
                    var listener = atom.listeners[keys[i]];
                    listener.callback.call(listener.scope);
                }
            }
        }
    });
}

class Atom<T> {
    id = ++Atom.ID;
    obj:any;
    key:string;
    value:T;
    listeners:{[id: string]: Listener} = {};

    private static ID = 0;

    constructor(obj:any, key:string, value?:T) {
        this.obj = obj;
        this.key = key;
        this.value = value;
    }
}

class Listener {
    id = ++Listener.ID;
    masters:{[id: string]: Atom<any>} = {};
    private static ID = 0;

    constructor(public callback:()=>void, public scope:any) {}
}

class Observer2 {
    private stack:Atom<any>[];
    private cb = ()=>this.listen();
    private listener:Listener;

    constructor(private callback:()=>void, private scope?:Object) {
        this.listener = new Listener(this.callback, this.scope);
        this.listen();
    }

    private listen() {
        var old_stack = __observe_stack;
        __observe_stack = [];
        this.unlisten();
        this.callback.call(this.scope);
        this.stack = __observe_stack;
        __observe_stack = old_stack;

        for (var i = 0; i < this.stack.length; i++) {
            var atom = this.stack[i];
            if (!atom.listeners) {
                atom.listeners = {};
            }
            atom.listeners[this.listener.id] = this.listener;
            this.listener.masters[atom.id] = atom;
        }
        return this;
    }

    unlisten() {
        if (this.stack) {
            for (var i = 0; i < this.stack.length; i++) {
                var atom = this.stack[i];
                if (!atom.listeners) {
                    atom.listeners = {};
                }
                this.listener.masters[atom.id] = null;
            }
        }
        return this;
    }
}

class Test {
    @observe a:string;
    @observe b:string;
    c:string;
}

var test = new Test();

class CCC {
    index:number = 1;

    constructor() {
        new Observer2(()=> {
            test.a;
            test.b;
            console.log("observer launch", this.index);
        });
    }
}
new CCC();
