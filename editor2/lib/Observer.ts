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
                    atom = new Atom(null, this, key);
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
                    atom = new Atom(val, this, key);
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
        private listeners:{[id: string]: Watcher | Atom<any>} = {};
        private static ID = 0;

        constructor(private value?:T, private owner?:any, private key?:string) {}

        get() {
            mastersStack.push(this);
            return this.value;
        }

        set(val:T) {
            if (this.value === val) {
                return;
            }
            this.value = val;
            if (this.listeners) {
                for (let keys = Object.keys(this.listeners), i = 0; i < keys.length; i++) {
                    let watcher = this.listeners[keys[i]];
                    if (watcher instanceof Watcher) {
                        watcher.watch();
                    }
                    else if (watcher instanceof Atom) {
                        watcher.set(val);
                    }
                }
            }
        }

        sync(atom:Atom<any>) {
            this.value = atom.value;
            atom.setListener(this);
            this.setListener(atom);
        }

        unsync(atom:Atom<any>) {
            atom.removeListener(this);
            this.removeListener(atom);
        }

        removeListener(listener:Watcher | Atom<any>) {
            this.listeners[listener.id] = void 0;
        }

        setListener(watcher:Watcher | Atom<any>) {
            if (!this.listeners) {
                this.listeners = {};
            }
            this.listeners[watcher.id] = watcher;
        }

        static get from() {
            let oldStack = mastersStack;
            mastersStack = [];
            return <T>(val:T):Atom<T> => {
                var atom = mastersStack.shift();
                mastersStack = oldStack;
                return atom;
            };
        }
    }

    export class Watcher {
        id = ++Watcher.ID;
        private masters:{[id: string]: Atom<any>} = {};
        private static ID = 0;

        constructor(private callback:()=>void, private scope?:any) {}

        unsubscribe() {
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

        watch() {
            this.unsubscribe();
            let oldStack = mastersStack;
            mastersStack = [];
            this.callback.call(this.scope);
            this.subscribe(mastersStack);
            mastersStack = oldStack;
            return this;
        }
    }
}
var observe = observer.observe;

class Test {
    @observe a:string;
    @observe b:string;

    c:string;
}

let test = new Test();

class CCC {
    index:number = 1;
    ob:observer.Watcher;

    constructor() {
        this.ob = new observer.Watcher(()=> {
            test.a;
            test.b;
            console.log("observer launch", this.index);
        }).watch();
    }
}
var ccc = new CCC();














