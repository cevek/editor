var __observe_stack:any[] = [];
function observe(obj:any, key:string) {
    return {
        get: function () {
            __observe_stack.push([this, key]);
            return this[key + "_"];
        },
        set: function (val:any) {
            if (this.__listeners && this.__listeners[key]) {
                for (var i = 0; i < this.__listeners[key].length; i++) {
                    var listener = this.__listeners[key][i];
                    listener();
                }
            }
            this[key + "_"] = val;
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
                        item[0].__listeners = item[0].__listeners || {};
                        item[0].__listeners[item[1]] = item[0].__listeners[item[1]] || [];
                        item[0].__listeners[item[1]].push(f);
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
    index: number = 1;
    constructor() {
        Observer(test.a, test.b).listen(()=> {
            console.log("observer launch", this.index);
        });
    }
}

new CCC();