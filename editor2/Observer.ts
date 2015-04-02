var __observe_stack:any[] = [];

var Sym = (<any>window).Symbol || function (name:string) {return '__' + name};
var globalObserver = Sym("observer");
var globalListeners = Sym("listeners");

function observe(obj:any, key:string) {
    return {
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
            if (this[globalObserver][globalListeners][key]) {
                for (var i = 0; i < this[globalObserver][globalListeners][key].length; i++) {
                    var listener = this[globalObserver][globalListeners][key][i];
                    listener();
                }
            }
            this[globalObserver][key] = val;
        }
    }
}

interface Lis {
    listen(fn:()=>void):void;
}
declare
function Observer(...deps:any[]):Lis;

Object.defineProperty(window, 'Observer', {
    get: function () {
        var old_stack = __observe_stack;
        __observe_stack = [];
        return function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var stack = __observe_stack;
            __observe_stack = old_stack;
            return {
                listen: function (f:()=>any) {
                    for (var i = 0; i < stack.length; i++) {
                        var item = stack[i];
                        var listeners = item[0][globalObserver][globalListeners];
                        listeners[item[1]] = listeners[item[1]] || [];
                        listeners[item[1]].push(f);
                    }
                    console.assert(stack.length === args.length, `Not all variables observed: ${stack.length} of ${args.length}`, stack);
                }
            };
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
        Observer(test.a, test.b).listen(()=> {
            console.log("observer launch", this.index);
        });
    }
}

new CCC();
