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
        private watchers:{[id: string]: Watcher} = {};
        private static ID = 0;

        constructor(private obj:any, private key:string, private value?:T) {}

        get() {
            mastersStack.push(this);
            return this.value;
        }

        set(val:T) {
            if (this.value === val) {
                return;
            }
            this.value = val;
            if (this.watchers) {
                for (let keys = Object.keys(this.watchers), i = 0; i < keys.length; i++) {
                    let watcher = this.watchers[keys[i]];
                    if (watcher) {
                        watcher.watch();
                    }
                }
            }
        }

        sync(atom:Atom<any>) {
            if (atom) {
                this.value = atom.value;
                atom.setWatcher(new Watcher(() => this.set(atom.value)));
                this.setWatcher(new Watcher(() => atom.set(this.value)));
            }
        }

        removeWatcher(watcher:Watcher) {
            this.watchers[watcher.id] = void 0;
        }

        setWatcher(watcher:Watcher) {
            if (!this.watchers) {
                this.watchers = {};
            }
            this.watchers[watcher.id] = watcher;
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
                masterAtom.removeWatcher(this);
            }
            this.masters = {};
        }

        subscribe(stack:Atom<any>[]) {
            for (let i = 0; i < stack.length; i++) {
                let atom = stack[i];
                atom.setWatcher(this);
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
import observe = observer.observe;

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














