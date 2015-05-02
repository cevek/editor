var __observe_stack:Stack[] = [];

var Sym = (<any>window).Symbol || function (name:string) {return '__' + name};
var globalObserver = Sym("observer");
var globalListeners = Sym("listeners");

function observe(obj:any, key:string) {
    Object.defineProperty(obj, key, {
        enumerable: true,
        get: function () {
            __observe_stack.push({obj: this, key: key});
            if (!this[globalObserver]) {
                this[globalObserver] = {};
                this[globalObserver][globalListeners] = {};
            }
            return this[globalObserver][key];
        },
        set: function (val:any) {
            if (!this[globalObserver]) {
                this[globalObserver] = {};
                this[globalObserver][globalListeners] = {};
            }
            this[globalObserver][key] = val;
            if (this[globalObserver][globalListeners][key]) {
                for (var i = 0; i < this[globalObserver][globalListeners][key].length; i++) {
                    var listener = this[globalObserver][globalListeners][key][i];
                    listener();
                }
            }
        }
    });
}

class Stack {
    key:string;
    obj:any;
}
class Observer2 {
    private stack:Stack[];
    private cb = ()=>this.listen();

    constructor(private callback:()=>void) {
        this.listen();
    }

    private listen() {
        var old_stack = __observe_stack;
        __observe_stack = [];
        this.unlisten();
        this.callback();
        this.stack = __observe_stack;
        __observe_stack = old_stack;

        for (var i = 0; i < this.stack.length; i++) {
            var stack = this.stack[i];
            var listeners = stack.obj[globalObserver][globalListeners];
            listeners[stack.key] = listeners[stack.obj] || [];
            listeners[stack.key].push(this.cb);
        }
        return this;
    }

    unlisten() {
        if (this.stack) {
            for (var i = 0; i < this.stack.length; i++) {
                var stack = this.stack[i];
                var listeners = stack.obj[globalObserver][globalListeners];
                listeners[stack.key] = listeners[stack.key] || [];
                var pos = listeners[stack.key].indexOf(this.cb);
                if (pos > -1) {
                    listeners[stack.key].splice(pos, 1);
                }
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
            console.log("observer launch", this.index);
        });
    }
}

///new CCC();
