var __observe_stack:any[] = [];

var Sym = (<any>window).Symbol || function (name:string) {return '__' + name};
var globalObserver = Sym("observer");
var globalListeners = Sym("listeners");

function observe(obj:any, key:string) {
    Object.defineProperty(obj, key, {
        enumerable: true,
        get: function () {
            __observe_stack.push([this, key]);
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

class Observed {
    constructor(private stack:any[], private args:any[]) {}

    listen(callback:()=>void) {
        for (var i = 0; i < this.stack.length; i++) {
            var item = this.stack[i];
            var listeners = item[0][globalObserver][globalListeners];
            listeners[item[1]] = listeners[item[1]] || [];
            listeners[item[1]].push(callback);
        }
        return this;
    }

    unlisten(callback:()=>void) {
        for (var i = 0; i < this.stack.length; i++) {
            var item = this.stack[i];
            var listeners = item[0][globalObserver][globalListeners];
            listeners[item[1]] = listeners[item[1]] || [];
            var pos = listeners[item[1]].indexOf(callback);
            if (pos > -1) {
                listeners[item[1]].splice(pos, 1);
            }
        }
        return this;
    }
}

declare
function Observer(...deps:any[]):Observed;

Object.defineProperty(window, 'Observer', {
    get: function () {
        var old_stack = __observe_stack;
        __observe_stack = [];
        return function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var stack = __observe_stack;
            __observe_stack = old_stack;
            if (stack.length !== args.length) {
                throw new Error(`Not all parameters observed: ${stack.length} of ${args.length}`);
            }
            return new Observed(stack, args);
        };
    }
});

class Test {
    @observe a:string;
    @observe b:string;
    c:string;
}

var test = new Test();

class CCC {
    index:number = 1;

    constructor() {
        Observer(test.a, test.b, ()=> {
            console.log("observer launch", this.index);
        });
    }
}

///new CCC();
