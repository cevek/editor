module observer {
    let mastersStack:Atom<any>[] = [];
    let ns = ((<any>window).Symbol || function (name:string) {return '__' + name})('observer');

    export function observe(obj:any, key:string) {
        var pd = Object.getOwnPropertyDescriptor(obj, key);
        var ppd = {
            enumerable: true,
            configurable: true,
            get: function getter() {
                if (pd && pd.get) {
                    pd.get();
                }
                if (!this[ns]) {
                    this[ns] = {};
                }
                let atom:Atom<any> = this[ns][key];
                if (!atom) {
                    atom = new Atom(this, key);
                    this[ns][key] = atom;
                }
                return atom.get();
            },
            set: function setter(val:any) {
                if (pd && pd.set) {
                    pd.set(val);
                }
                if (!this[ns]) {
                    this[ns] = {};
                }
                let atom:Atom<any> = this[ns][key];
                if (!this[ns][key]) {
                    atom = new Atom(this, key, val);
                    this[ns][key] = atom;
                }
                atom.set(val);
            }
        };
        Object.defineProperty(obj, key, ppd);
        return ppd;
    }

    export class Atom<T> {
        id = ++Atom.ID;
        private listeners:{[id: string]: Listener} = {};
        private static ID = 0;

        constructor(private obj:any, private key:string, private value?:T) {}

        get() {
            mastersStack.push(this);
            return this.value;
        }

        set(val:T) {
            this.value = val;
            if (this.listeners) {
                for (let keys = Object.keys(this.listeners), i = 0; i < keys.length; i++) {
                    let listener = this.listeners[keys[i]];
                    if (listener) {
                        listener.call();
                    }
                }
            }
        }

        removeListener(listener:Listener) {
            this.listeners[listener.id] = void 0;
        }

        setListener(listener:Listener) {
            if (!this.listeners) {
                this.listeners = {};
            }
            this.listeners[listener.id] = listener;
        }
    }

    export class Listener {
        id = ++Listener.ID;
        private masters:{[id: string]: Atom<any>} = {};
        private static ID = 0;

        constructor(private callback:()=>void, private scope:any) {}

        unSubscribe() {
            for (let keys = Object.keys(this.masters), j = 0; j < keys.length; j++) {
                let masterAtom = this.masters[keys[j]];
                masterAtom.removeListener(this);
            }
            this.masters = {};
        }

        subscribe(stack:Atom<any>[]) {
            for (let i = 0; i < stack.length; i++) {
                let atom = stack[i];
                atom.setListener(this);
                this.masters[atom.id] = atom;
            }
        }

        call() {
            this.unSubscribe();
            let oldStack = mastersStack;
            mastersStack = [];
            this.callback.call(this.scope);
            this.subscribe(mastersStack);
            mastersStack = oldStack;
        }
    }

    export function watch(callback:()=>void, scope?:Object) {
        var listener = new Listener(callback, scope);
        listener.call();
        return listener;
    }
}
import observe = observer.observe;

class Test {
    @observe a:string;
    @observe b:string;

    c:string;
}

let test = new Test();

class CCC {
    index:number = 1;
    ob:observer.Listener;

    constructor() {
        this.ob = observer.watch(()=> {
            test.a;
            test.b;
            console.log("observer launch", this.index);
        });
    }
}
var ccc = new CCC();














