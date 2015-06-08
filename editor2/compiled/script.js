var Observable = (function () {
    function Observable() {
        this.listeners = [];
    }
    Observable.prototype.changed = function () {
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];
            listener();
        }
    };
    Observable.prototype.listen = function (callback) {
        this.listeners.push(callback);
        return this;
    };
    Observable.prototype.unlisten = function (callback) {
        var pos = this.listeners.indexOf(callback);
        if (pos > -1) {
            this.listeners.splice(pos, 1);
        }
    };
    return Observable;
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var observer;
(function (observer) {
    var mastersStack = [];
    var ns = (window.Symbol || function (name) { return '__' + name; })('observer');
    function observe(obj, key) {
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
                var atom = this[ns][key];
                if (!atom) {
                    atom = new Atom(null, this, key);
                    this[ns][key] = atom;
                }
                return atom.get();
            },
            set: function setter(val) {
                if (pd && pd.set) {
                    pd.set(val);
                }
                if (!this[ns]) {
                    this[ns] = {};
                }
                var atom = this[ns][key];
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
    observer.observe = observe;
    var Atom = (function () {
        function Atom(value, owner, key) {
            this.value = value;
            this.owner = owner;
            this.key = key;
            this.id = ++Atom.ID;
            this.listeners = {};
        }
        Atom.prototype.get = function () {
            mastersStack.push(this);
            return this.value;
        };
        Atom.prototype.set = function (val) {
            if (this.value === val) {
                return;
            }
            this.value = val;
            if (this.listeners) {
                for (var keys = Object.keys(this.listeners), i = 0; i < keys.length; i++) {
                    var watcher = this.listeners[keys[i]];
                    if (watcher instanceof Watcher) {
                        watcher.watch();
                    }
                    else if (watcher instanceof Atom) {
                        watcher.set(val);
                    }
                    else if (watcher instanceof Listener) {
                        watcher.call(val);
                    }
                }
            }
        };
        Atom.prototype.sync = function (atom) {
            this.value = atom.value;
            atom.setListener(this);
            this.setListener(atom);
        };
        Atom.prototype.unsync = function (atom) {
            atom.removeListener(this);
            this.removeListener(atom);
        };
        Atom.prototype.removeListener = function (listener) {
            this.listeners[listener.id] = void 0;
        };
        Atom.prototype.setListener = function (listener) {
            if (!this.listeners) {
                this.listeners = {};
            }
            this.listeners[listener.id] = listener;
        };
        Object.defineProperty(Atom, "from", {
            get: function () {
                var oldStack = mastersStack;
                mastersStack = [];
                return function (val) {
                    var atom = mastersStack.shift();
                    mastersStack = oldStack;
                    return atom;
                };
            },
            enumerable: true,
            configurable: true
        });
        Atom.ID = 0;
        return Atom;
    })();
    observer.Atom = Atom;
    var Listener = (function () {
        function Listener(callback, scope) {
            this.callback = callback;
            this.scope = scope;
            this.id = ++Atom.ID;
        }
        Listener.prototype.call = function (val) {
            if (this.callback) {
                this.callback.call(this.scope, val);
            }
        };
        return Listener;
    })();
    observer.Listener = Listener;
    var Watcher = (function () {
        function Watcher(callback, scope) {
            this.callback = callback;
            this.scope = scope;
            this.id = ++Atom.ID;
            this.masters = {};
        }
        Watcher.prototype.unsubscribe = function () {
            for (var keys = Object.keys(this.masters), j = 0; j < keys.length; j++) {
                var masterAtom = this.masters[keys[j]];
                masterAtom.removeListener(this);
            }
            this.masters = {};
        };
        Watcher.prototype.subscribe = function (stack) {
            for (var i = 0; i < stack.length; i++) {
                var atom_1 = stack[i];
                atom_1.setListener(this);
                this.masters[atom_1.id] = atom_1;
            }
        };
        Watcher.prototype.watch = function () {
            if (this.callback) {
                this.unsubscribe();
                var oldStack = mastersStack;
                mastersStack = [];
                this.callback.call(this.scope);
                this.subscribe(mastersStack);
                mastersStack = oldStack;
            }
            return this;
        };
        return Watcher;
    })();
    observer.Watcher = Watcher;
})(observer || (observer = {}));
var observe = observer.observe;
var Test = (function () {
    function Test() {
    }
    __decorate([
        observe
    ], Test.prototype, "a");
    __decorate([
        observe
    ], Test.prototype, "b");
    return Test;
})();
var test = new Test();
var CCC = (function () {
    function CCC() {
        var _this = this;
        this.index = 1;
        this.ob = new observer.Watcher(function () {
            test.a;
            test.b;
            console.log("observer launch", _this.index);
        }).watch();
    }
    return CCC;
})();
var ccc = new CCC();
/**
 * ------------------ The Life-Cycle of a Composite Component ------------------
 *
 * - constructor: Initialization of state. The instance is now retained.
 *   - componentWillMount
 *   - render
 *   - [children's constructors]
 *     - [children's componentWillMount and render]
 *     - [children's componentDidMount]
 *     - componentDidMount
 *
 *       Update Phases:
 *       - componentWillReceiveProps (only called if parent updated)
 *       - shouldComponentUpdate
 *         - componentWillUpdate
 *           - render
 *           - [children's constructors or receive props phases]
 *         - componentDidUpdate
 *
 *     - componentWillUnmount
 *     - [children's componentWillUnmount]
 *   - [children destroyed]
 * - (destroyed): The instance is now blank, released by React and ready for GC.
 *
 * -----------------------------------------------------------------------------
 */
var virtual;
(function (virtual) {
    var currentState = 0 /* CREATE */;
    function updateCallback(oldNode) {
        oldNode.component.update();
    }
    var Component = (function () {
        function Component() {
            this.id = ++Component.ID;
            this.attrs = {};
            this.children = [];
            this.transparent = false;
            this.watchers = [];
        }
        Component.prototype.componentName = function () {
            var name = this.constructor.name;
            return name.replace(/([A-Z]+)/g, function (m) { return '-' + m; }).replace(/^-+/, '').toLowerCase();
        };
        Component.prototype.root = function () {
            var children = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                children[_i - 0] = arguments[_i];
            }
            return vd(this.componentName(), this.attrs, children);
        };
        Component.prototype.rootWithAttrs = function (attrs) {
            var children = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                children[_i - 1] = arguments[_i];
            }
            return vd(this.componentName(), virtual.extend(attrs, this.attrs), children);
        };
        Component.prototype.watch = function (method) {
            var watcher = new observer.Watcher(method, this).watch();
            this.watchers.push(watcher);
            return watcher;
        };
        Component.prototype.updateAttrs = function () { };
        Component.prototype.componentDidMount = function () { };
        Component.prototype.componentWillUnmount = function () { };
        Component.prototype.componentWillMount = function () { };
        Component.prototype.destructor = function () {
            this.watchers.forEach(function (watcher) { return watcher.unsubscribe(); });
        };
        Component.prototype.render = function () { return null; };
        Component.prototype.destroyChildren = function (children) {
            for (var _i = 0; _i < children.length; _i++) {
                var child = children[_i];
                if (child instanceof Array) {
                    this.destroyChildren(child);
                }
                else {
                    if (child && child instanceof virtual.VNode && child.component) {
                        child.component.destructor();
                    }
                }
            }
        };
        Component.prototype.update = function () {
            var _this = this;
            var newNode = this.render();
            if (!newNode) {
                newNode = new virtual.VNode(); //'#', null, null, {}, this, ['']);
            }
            if (!newNode.events) {
                newNode.events = {};
            }
            newNode.events['$created'] = function () { return _this.componentDidMount(); };
            newNode.events['$destroyed'] = function () { return _this.componentWillUnmount(); };
            newNode.component = this;
            if (this.rootNode) {
                /*
                                if (this.rootNode.children !== newNode.children) {
                                    this.destroyChildren(this.rootNode.children);
                                }
                */
                if (this.rootNode.dom) {
                    cito.vdom.update(this.rootNode, newNode);
                }
            }
            else {
                this.rootNode = new virtual.VCNodeRoot();
            }
            if (this.DESTROYED) {
                return;
            }
            this.rootNode.replaceWith(newNode);
        };
        Component.prototype.init = function (props) {
            var children = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                children[_i - 1] = arguments[_i];
            }
            if (children[0] && typeof children[0] === 'object' && !(children[0] instanceof Array)
                && children[0].children === void 0 && children[0].tag === void 0) {
                this.attrs = children.shift();
            }
            if (!this.attrs) {
                this.attrs = {};
            }
            this.props = props;
            this.children = children;
            this.updateAttrs();
            this.componentWillMount();
            var watcher = new observer.Watcher(this.update, this).watch();
            this.watchers.push(watcher);
            return this.rootNode;
        };
        Component.ID = 0;
        return Component;
    })();
    virtual.Component = Component;
})(virtual || (virtual = {}));
//import vc = virtual.vc;
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var FPSMeter = (function () {
    function FPSMeter() {
        var _this = this;
        this.counter = 0;
        this.startTime = 0;
        this.fps = 0;
        setInterval(function () { return _this.update(); }, 1000);
    }
    FPSMeter.prototype.update = function () {
        var now = Date.now();
        this.fps = 1000 / ((now - this.startTime) / this.counter) | 0;
        this.startTime = now;
        this.counter = 0;
    };
    FPSMeter.prototype.lap = function () {
        this.counter++;
    };
    return FPSMeter;
})();
var SpeedTest = (function (_super) {
    __extends(SpeedTest, _super);
    function SpeedTest() {
        _super.apply(this, arguments);
        this.items = [];
        this.counter = 0;
        this.fpsMeter = new FPSMeter();
    }
    SpeedTest.prototype.updateItems = function () {
        var _this = this;
        this.counter++;
        for (var i = 0; i < 150; i++) {
            this.items[i] = this.items[i] || [];
            for (var j = 0; j < 20; j++) {
                this.items[i][j] = this.counter + i + j;
            }
        }
        this.fpsMeter.lap();
        this.update();
        setTimeout(function () { return _this.updateItems(); });
    };
    SpeedTest.prototype.componentWillMount = function () {
        this.updateItems();
    };
    SpeedTest.prototype.render = function () {
        return this.root(vd('div', 'FPS:', this.fpsMeter.fps), vd('div', this.items.map(function (row) {
            return vd('div', row.map(function (cell) {
                return vd('div.inline', cell);
            }));
        })));
    };
    return SpeedTest;
})(virtual.Component);
var SpeedTestReact = (function (_super) {
    __extends(SpeedTestReact, _super);
    function SpeedTestReact() {
        _super.apply(this, arguments);
        this.items = [];
        this.counter = 0;
        this.fpsMeter = new FPSMeter();
    }
    SpeedTestReact.prototype.updateItems = function () {
        var _this = this;
        this.counter++;
        for (var i = 0; i < 150; i++) {
            this.items[i] = this.items[i] || [];
            for (var j = 0; j < 20; j++) {
                this.items[i][j] = this.counter + i + j;
            }
        }
        this.fpsMeter.lap();
        this.forceUpdate();
        setTimeout(function () { return _this.updateItems(); });
    };
    SpeedTestReact.prototype.componentWillMount = function () {
        console.log("componentWillMount");
        this.updateItems();
    };
    SpeedTestReact.prototype.render = function () {
        return React.createElement('div', null, React.createElement('div', null, 'FPS:', this.fpsMeter.fps), this.items.map(function (row) {
            return React.createElement('div', null, row.map(function (cell) {
                return React.createElement('div', { className: 'inline' }, cell);
            }));
        }));
    };
    return SpeedTestReact;
})(React.Component);
if (location.hash === '#react') {
    React.render(React.createElement(SpeedTestReact, null), document.body);
}
if (location.hash === '#argentum') {
    setTimeout(function () {
        new SpeedTest().init({}).mount(document.body);
    });
}
///<reference path="Component.ts"/>
///<reference path="SpeedTest.ts"/>
var virtual;
(function (virtual) {
    function d() {
        var children = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            children[_i - 0] = arguments[_i];
        }
        var vnode;
        var tag;
        var attrs = {};
        var events = {};
        var key;
        var classes = [];
        if (typeof children[0] === 'string') {
            tag = children.shift();
            var chunks = tag.split('.');
            tag = chunks.shift() || 'div';
            classes = chunks;
        }
        children = flatArray(children);
        if (children[0] && typeof children[0] === 'object' && !(children[0] instanceof Array)
            && children[0].children === void 0 && children[0].tag === void 0) {
            attrs = children.shift();
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
                var keys_1 = Object.keys(attrs.classes);
                for (var _a = 0; _a < keys_1.length; _a++) {
                    key = keys_1[_a];
                    if (attrs.classes[key]) {
                        classes.push(key);
                    }
                }
                attrs.classes = void 0;
            }
            if (attrs.style) {
                var keys_2 = Object.keys(attrs.style);
                var newStyle = {};
                for (var _b = 0; _b < keys_2.length; _b++) {
                    var key_1 = keys_2[_b];
                    var kkey = key_1.replace(/([A-Z])/g, function (m) { return '-' + m.toLowerCase(); });
                    newStyle[kkey] = attrs.style[key_1];
                }
                attrs.style = newStyle;
            }
            var keys = Object.keys(attrs);
            var newAttrs = {};
            for (var _c = 0; _c < keys.length; _c++) {
                var key_2 = keys[_c];
                if (key_2[0] == 'o' && key_2[1] == 'n') {
                    events[key_2.substr(2)] = attrs[key_2];
                    continue;
                }
                if (attrs[key_2] !== void 0) {
                    var newKey = key_2.replace(/([A-Z])/g, function (m) { return '-' + m.toLowerCase(); });
                    newAttrs[newKey] = attrs[key_2];
                }
            }
            attrs = newAttrs;
        }
        if (classes.length) {
            attrs.class = classes.join(' ');
        }
        var node = new VNode();
        node.tag = tag;
        node.attrs = attrs;
        node.key = key;
        node.events = events;
        node.children = children;
        return node;
    }
    virtual.d = d;
    function extend(obj, to) {
        if (obj && typeof obj == 'object' && to) {
            for (var i = 0, keys = Object.keys(obj); i < keys.length; i++) {
                var key = keys[i];
                to[key] = extend(obj[key], to[key]);
            }
        }
        else {
            to = obj;
        }
        return to;
    }
    virtual.extend = extend;
    var VNode = (function () {
        function VNode() {
            this.dom = null;
            this.domLength = null;
        }
        VNode.prototype.mount = function (node) {
            cito.vdom.append(node, this);
            return this.dom;
        };
        return VNode;
    })();
    virtual.VNode = VNode;
    var VCNodeRoot = (function (_super) {
        __extends(VCNodeRoot, _super);
        function VCNodeRoot() {
            _super.call(this);
        }
        VCNodeRoot.prototype.replaceWith = function (newNode) {
            this.attrs = newNode.attrs;
            this.children = newNode.children;
            this.component = newNode.component;
            this.events = newNode.events;
            this.key = newNode.key;
            this.tag = newNode.tag;
            this.dom = newNode.dom;
            this.domLength = newNode.domLength;
        };
        VCNodeRoot.prototype.syncComponent = function (oldNode) {
            //return false;
            var dom = oldNode.dom;
            if (dom) {
                var oldComp = oldNode.component;
                var newCmp = this.component;
                //console.log(newCmp.componentName(), !!oldComp, oldComp !== newCmp, oldComp && oldComp.constructor === newCmp.constructor);
                if (oldComp && oldComp !== newCmp && oldComp.constructor === newCmp.constructor) {
                    oldComp.attrs = newCmp.attrs;
                    oldComp.props = newCmp.props;
                    oldComp.children = newCmp.children;
                    newCmp.destructor();
                    newCmp.DESTROYED = true;
                    oldComp.updateAttrs();
                    oldComp.REPLACED = true;
                    oldComp.update();
                    this.replaceWith(oldNode);
                    return true;
                }
            }
            return false;
        };
        return VCNodeRoot;
    })(VNode);
    virtual.VCNodeRoot = VCNodeRoot;
    function flatArray(array) {
        var nodes = [];
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
    virtual.flatArray = flatArray;
})(virtual || (virtual = {}));
var vd = virtual.d;
var EventEmitter = (function () {
    function EventEmitter() {
        this.listeners = [];
    }
    EventEmitter.prototype.emit = function (val) {
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];
            listener(val);
        }
    };
    EventEmitter.prototype.listen = function (callback) {
        this.listeners.push(callback);
        return this;
    };
    EventEmitter.prototype.unlisten = function (callback) {
        var pos = this.listeners.indexOf(callback);
        if (pos > -1) {
            this.listeners.splice(pos, 1);
        }
    };
    return EventEmitter;
})();
var HTTP = (function () {
    function HTTP() {
    }
    HTTP.request = function (method, url, data) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open(method, url, true);
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        try {
                            var data = JSON.parse(req.responseText);
                            resolve(data);
                        }
                        catch (e) {
                            console.error(e);
                            reject(req.responseText);
                        }
                    }
                    else {
                        reject(req);
                    }
                }
            };
            req.send(data);
        });
    };
    HTTP.requestRaw = function (method, url, data, responseType) {
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open(method, url, true);
            if (responseType) {
                req.responseType = responseType;
            }
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        resolve(req.response);
                    }
                    else {
                        reject(req);
                    }
                }
            };
            req.send(data);
        });
    };
    HTTP.get = function (url, raw, responseType) {
        if (raw === void 0) { raw = false; }
        return raw ? HTTP.requestRaw('GET', url, null, responseType) : HTTP.request('GET', url);
    };
    return HTTP;
})();
var List = (function () {
    function List(array) {
        this.length = 0;
        if (array) {
            for (var i = 0; i < array.length; i++) {
                this[i] = array[i];
            }
            this.length = array.length;
        }
    }
    List.prototype.get = function (index) {
        return this[index];
    };
    List.prototype.set = function (index, value) {
        this[index] = value;
        if (this.length < index + 1) {
            this.length = index + 1;
        }
    };
    List.prototype.isEmpty = function () {
        return this.length === 0;
    };
    List.prototype.isNotEmpty = function () {
        return this.length > 0;
    };
    List.prototype.clear = function () {
        while (this.length)
            this.pop();
    };
    List.prototype.remove = function (item) {
        var pos = this.indexOf(item);
        if (pos > -1) {
            this.splice(pos, 1);
        }
    };
    List.prototype.replace = function (array) {
        for (var i = 0; i < array.length; i++) {
            this[i] = array[i];
        }
        for (var i = array.length; i < this.length; i++) {
            this[i] = null;
        }
        this.length = array.length;
    };
    List.prototype.concat = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        return new List(Array.prototype.concat.apply(this, items));
    };
    List.prototype.join = function (separator) {
        return Array.prototype.join.call(this, separator);
    };
    List.prototype.pop = function () {
        var ret = Array.prototype.pop.call(this);
        return ret;
    };
    List.prototype.push = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        var ret = Array.prototype.push.apply(this, items);
        return ret;
    };
    List.prototype.reverse = function () {
        var ret = Array.prototype.reverse.call(this);
        return this;
    };
    List.prototype.shift = function () {
        var ret = Array.prototype.shift.call(this);
        return ret;
    };
    List.prototype.slice = function (start, end) {
        var ret = Array.prototype.slice.call(this, start, end);
        return new List(ret);
    };
    List.prototype.toArray = function () {
        return Array.prototype.slice.call(this);
    };
    List.prototype.sort = function (compareFn) {
        var ret = Array.prototype.sort.call(this, compareFn);
        return this;
    };
    List.prototype.splice = function (start, deleteCount) {
        var items = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            items[_i - 2] = arguments[_i];
        }
        var ret = Array.prototype.splice.apply(this, arguments);
        return this;
    };
    List.prototype.unshift = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i - 0] = arguments[_i];
        }
        var ret = Array.prototype.unshift.apply(this, items);
        return ret;
    };
    List.prototype.indexOf = function (searchElement, fromIndex) {
        return Array.prototype.indexOf.call(this, searchElement, fromIndex);
    };
    List.prototype.lastIndexOf = function (searchElement, fromIndex) {
        return Array.prototype.lastIndexOf.call(this, searchElement, fromIndex);
    };
    List.prototype.every = function (callbackfn, thisArg) {
        return Array.prototype.every.call(this, callbackfn, thisArg);
    };
    List.prototype.some = function (callbackfn, thisArg) {
        return Array.prototype.some.call(this, callbackfn, thisArg);
    };
    List.prototype.forEach = function (callbackfn, thisArg) {
        return Array.prototype.forEach.call(this, callbackfn, thisArg);
    };
    List.prototype.map = function (callbackfn, thisArg) {
        return Array.prototype.map.call(this, callbackfn, thisArg);
    };
    List.prototype.filter = function (callbackfn, thisArg) {
        return Array.prototype.filter.call(this, callbackfn, thisArg);
    };
    List.prototype.reduce = function (callbackfn, inVal) {
        return Array.prototype.reduce.call(this, callbackfn, inVal);
    };
    List.prototype.reduceRight = function (callbackfn, inVal) {
        return Array.prototype.reduceRight.call(this, callbackfn, inVal);
    };
    return List;
})();
var div = React.createFactory('div');
var span = React.createFactory('span');
var a = React.createFactory('a');
var cx = React.addons.classSet;
var Line = (function () {
    function Line(en, ru) {
        if (en === void 0) { en = new LangItem; }
        if (ru === void 0) { ru = new LangItem; }
        this.linked = false;
        this.lang = { en: en, ru: ru };
    }
    Line.prototype.isEmpty = function () {
        return this.lang.en.isEmpty() && this.lang.ru.isEmpty();
    };
    return Line;
})();
var LangItem = (function () {
    function LangItem(data) {
        if (data === void 0) { data = { start: 0, end: 0, text: '' }; }
        this.start = data.start;
        this.end = data.end;
        this.text = data.text;
    }
    LangItem.prototype.isEmpty = function () {
        return this.text.trim() === '';
    };
    return LangItem;
})();
var glob = {};
var LinesStore = (function () {
    function LinesStore() {
        this.data = [];
        this.shiftTime = 5037.3;
    }
    LinesStore.prototype.add = function (v) {
        this.data.push(v);
    };
    LinesStore.prototype.insert = function (pos, line) {
        return this.data.splice(pos, 0, line);
    };
    LinesStore.prototype.remove = function (pos) {
        return this.data.splice(pos, 1);
    };
    LinesStore.prototype.replace = function (array) {
        this.data = array;
    };
    LinesStore.prototype.parse = function (en, ru) {
        var enLines = this.parseSrt(en);
        var ruLines = this.parseSrt(ru);
        var max = Math.max(enLines.length, ruLines.length);
        for (var i = 0; i < max; i++) {
            var line = new Line(enLines[i] || new LangItem(), ruLines[i] || new LangItem());
            this.add(line);
        }
        this.sync2();
    };
    LinesStore.prototype.removeLine = function (append, line, lang) {
        if (line < 0 || line >= this.data.length || (append && line === 0)) {
            return null;
        }
        var change = new Change();
        change.command = 'remove';
        change.lang = lang;
        change.line = line;
        change.append = append;
        var firstLinked = this._firstLinked(line);
        var thisLine = this.data[line];
        var prevText2 = thisLine.lang[lang].text;
        change.pos = prevText2.length;
        if (!thisLine.linked && append) {
            var prevLine = this.data[line - 1];
            if (prevLine.lang[lang].isEmpty()) {
                prevLine.lang[lang] = thisLine.lang[lang];
            }
            else {
                prevLine.lang[lang].text += ' ' + prevText2.trim();
                prevLine.lang[lang].end = thisLine.lang[lang].end;
            }
            thisLine.lang[lang] = new LangItem();
        }
        else {
            change.removeLang = firstLinked;
            this.rm(line, firstLinked, lang);
        }
        if (this.data[firstLinked - 1].isEmpty()) {
            change.removeLine = firstLinked - 1;
            this.remove(firstLinked - 1);
            if (append) {
                var ln = line === firstLinked ? firstLinked : firstLinked - 1;
                change.insertLine = ln;
                this.insert(ln, new Line());
            }
        }
        return change;
    };
    LinesStore.prototype.rm = function (line, firstLinked, lang) {
        for (var i = line + 1; i < firstLinked; i++) {
            this.data[i - 1].lang[lang] = this.data[i].lang[lang];
        }
        if (line < firstLinked) {
            this.data[firstLinked - 1].lang[lang] = new LangItem();
        }
    };
    LinesStore.prototype.negateRm = function (line, firstLinked, lang) {
    };
    LinesStore.prototype._firstLinked = function (line) {
        var firstLinked = this.data.length;
        for (var i = line; i < this.data.length - 1; i++) {
            if (this.data[i].linked) {
                firstLinked = i;
                break;
            }
        }
        return firstLinked;
    };
    LinesStore.prototype.insertLine = function (cutPos, line, lang) {
        var realEnd = 0;
        if (cutPos === 0) {
            var currText = new LangItem();
            var nextText = '';
        }
        else {
            var currText = this.data[line].lang[lang];
            var firstText = currText.text.substr(0, cutPos);
            var nextText = currText.text.substr(cutPos);
            currText.text = firstText;
            realEnd = currText.end;
            currText.end = currText.start + (currText.end - currText.start) / 2;
            line++;
        }
        var textLine = new LangItem({
            start: currText.end,
            end: realEnd,
            text: nextText
        });
        var en = lang == 'en' ? textLine : new LangItem();
        var ru = lang == 'ru' ? textLine : new LangItem();
        //var negateLang = lang == 'en' ? 'ru' : 'en';
        var firstLinked = this._firstLinked(line);
        var nextEmptyLine = this.data.length;
        for (var i = line; i < this.data.length - 1; i++) {
            if (this.data[i].lang[lang].isEmpty()) {
                nextEmptyLine = i;
                break;
            }
        }
        var change = new Change;
        change.lang = lang;
        change.line = line;
        change.pos = cutPos;
        change.command = "insert";
        if (nextEmptyLine < firstLinked) {
            this.ins(nextEmptyLine + 1, line, lang, textLine);
            change.insertLang = nextEmptyLine;
        }
        else {
            change.removeLine = firstLinked;
            this.insert(firstLinked, new Line());
            firstLinked++;
            change.insertLang = firstLinked;
            this.ins(firstLinked, line, lang, textLine);
            for (var i = firstLinked + 1; i < this.data.length; i++) {
                if (this.data[i].isEmpty()) {
                    change.removeLine = i;
                    this.remove(i);
                    break;
                }
            }
        }
        return change;
    };
    LinesStore.prototype.ins = function (from, line, lang, textLine) {
        for (var i = from - 2; i >= line; i--) {
            this.data[i + 1].lang[lang] = this.data[i].lang[lang];
        }
        this.data[line].lang[lang] = textLine;
    };
    LinesStore.prototype.negateIns = function () {
    };
    LinesStore.prototype.undo = function (change) {
        var line = 0;
        var pos = 0;
        var lang = 'en';
        var currLine = this.data[line];
        var nextLine = this.data[line + 1];
        if (nextLine.isEmpty()) {
            currLine.lang[lang].text += nextLine.lang[lang].text;
        }
    };
    LinesStore.prototype.redo = function (change) {
    };
    LinesStore.prototype.parseSrt = function (subtitle) {
        var shift = this.shiftTime * 100;
        var re = /\d+\s+(-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3}) --> (-?)(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s+([\S\s]*?)(?=\d+\s+-?\d{2}:\d{2}:\d{2}|$)/g;
        var res;
        var subs = [];
        while (res = re.exec(subtitle)) {
            var start = (res[1] ? -1 : 1) * (+res[2] * 360000 + +res[3] * 6000 + +res[4] * 100 + +res[5] / 10 | 0);
            var end = (res[6] ? -1 : 1) * (+res[7] * 360000 + +res[8] * 6000 + +res[9] * 100 + +res[10] / 10 | 0);
            start = start - shift;
            end = end - shift;
            var text = res[11].trim();
            var bb = text.split(/[-–—][\t ]+/);
            for (var i = 0; i < bb.length; i++) {
                var t = bb[i].trim();
                if (t) {
                    subs.push(new LangItem({ start: start, end: end, text: t }));
                }
            }
        }
        return subs;
    };
    /*
        sync() {
            var lines = new LinesStore();
            var enLines = <LangItem[]>[];
            var ruLines = <LangItem[]>[];

            for (var i = 0; i < this.length; i++) {
                if (this[i].lang.en && this[i].lang.en.start) {
                    enLines.push(this[i].lang.en);
                }
                if (this[i].lang.ru && this[i].lang.ru.start) {
                    ruLines.push(this[i].lang.ru);
                }
            }

            var lastEnLine:LangItem;
            for (var i = 0, j = 0; i < enLines.length; i++) {
                var enLine = enLines[i];
                var enMiddle = enLine.start + (enLine.end - enLine.start) / 2;
                var l = j;
                var startJ = j;
                var prevDiff = Infinity;
                var ruLine:LangItem = null;
                while (true) {
                    ruLine = ruLines[l];
                    if (!ruLine) {
                        break;
                    }
                    var ruMiddle = ruLine.start + (ruLine.end - ruLine.start) / 2;
                    var diff = Math.abs(enMiddle - ruMiddle);
                    if (diff < 1000) {
                        j = l + 1;
                        break;
                    }
                    if (prevDiff < diff) {
                        ruLine = null;
                        break;
                    }
                    prevDiff = diff;
                    l++;
                }

                for (var k = startJ; k < j - 1; k++) {
                    var ruLine2 = ruLines[k];
                    //console.log("insert empty ru", k);
                    var line = new Line(new LangItem(), ruLine2);
                    lines.push(line);
                }

                if (ruLine) {
                    //console.log("insert ru", j);
                }

                if (lastEnLine) {
                    while (true) {
                        if ((lines.length) * 50 > enLine.start / 100 * 50) {
                            break;
                        }
                        var line = new Line(new LangItem(), new LangItem());
                        lines.push(line);
                    }
                }
                lastEnLine = enLine;
                var line = new Line(enLine, ruLine || new LangItem());
                lines.push(line);
            }

            for (var k = j; k < ruLines.length; k++) {
                var ruLine2 = ruLines[k];
                var line = new Line(new LangItem(), ruLine2);
                lines.push(line);
            }

            this.replace(lines);
            /!*


            //tests
                    var insertEn = 0;
                    var insertRu = 0;
                    var dupsRu = [];
                    var dubsRuCount = 0;
                    for (var i = 0; i < this.length; i++) {
                        var line = this[i];
                        if (!line.en.isEmpty()) {
                            insertEn++;
                        }
                        if (!line.ru.isEmpty()) {
                            if (dupsRu.indexOf(line.ru) > -1) {
                                console.log("dup ru", line.ru);
                                dubsRuCount++;
                            }
                            dupsRu.push(line.ru);
                            insertRu++;
                        }
                    }
                    console.log(enLines.length, insertEn, ruLines.length, insertRu, dubsRuCount);
                    console.log(ruLines);
            *!/

        }
    */
    LinesStore.prototype.createLinesUntil = function (array, k) {
        for (var i = array.length; i <= k; i++) {
            array.push(new Line(new LangItem(), new LangItem()));
        }
    };
    LinesStore.prototype.sync2 = function () {
        var lines = [];
        var enLines = [];
        var ruLines = [];
        var lastUsedLineEn = -1;
        var lastUsedLineRu = -1;
        for (var i = 0; i < this.data.length; i++) {
            if (this.data[i].lang.en && this.data[i].lang.en.start) {
                enLines.push(this.data[i].lang.en);
                var enMiddle = (this.data[i].lang.en.start + (this.data[i].lang.en.end - this.data[i].lang.en.start) / 2) / 100 / 2;
                var k = Math.max(Math.round(enMiddle), lastUsedLineEn + 1);
                lastUsedLineEn = k;
                this.createLinesUntil(lines, k);
                lines[k].lang.en = this.data[i].lang.en;
            }
            if (this.data[i].lang.ru && this.data[i].lang.ru.start) {
                ruLines.push(this.data[i].lang.ru);
                var ruMiddle = (this.data[i].lang.ru.start + (this.data[i].lang.ru.end - this.data[i].lang.ru.start) / 2) / 100 / 2;
                var k = Math.max(Math.round(ruMiddle), lastUsedLineRu + 1);
                lastUsedLineRu = k;
                this.createLinesUntil(lines, k);
                lines[k].lang.ru = this.data[i].lang.ru;
            }
        }
        this.replace(lines);
    };
    return LinesStore;
})();
var KeyboardKey = (function () {
    function KeyboardKey(e) {
        this.noMod = true;
        this.shiftMod = false;
        this.shiftLeftMod = false;
        this.shiftRightMod = false;
        this.altMod = false;
        this.altLeftMod = false;
        this.altRightMod = false;
        this.ctrlMod = false;
        this.ctrlLeftMod = false;
        this.ctrlRightMod = false;
        this.metaMod = false;
        this.metaLeftMod = false;
        this.metaRightMod = false;
        this.backspace = false;
        this.tab = false;
        this.enter = false;
        this.space = false;
        this.shift = false;
        this.ctrl = false;
        this.alt = false;
        this.meta = false;
        this.pauseBreak = false;
        this.capsLock = false;
        this.escape = false;
        this.pageUp = false;
        this.pageDown = false;
        this.end = false;
        this.home = false;
        this.left = false;
        this.up = false;
        this.right = false;
        this.down = false;
        this.insert = false;
        this.delete = false;
        this.f1 = false;
        this.f2 = false;
        this.f3 = false;
        this.f4 = false;
        this.f5 = false;
        this.f6 = false;
        this.f7 = false;
        this.f8 = false;
        this.f9 = false;
        this.f10 = false;
        this.f11 = false;
        this.f12 = false;
        this.numLock = false;
        this.scrollLock = false;
        this.semiColon = false;
        this.equalSign = false;
        this.comma = false;
        this.dash = false;
        this.period = false;
        this.forwardSlash = false;
        this.graveAccent = false;
        this.openBracket = false;
        this.backSlash = false;
        this.closeBraket = false;
        this.singleQuote = false;
        this.metaLeft = false;
        this.metaRight = false;
        this.numpad0 = false;
        this.numpad1 = false;
        this.numpad2 = false;
        this.numpad3 = false;
        this.numpad4 = false;
        this.numpad5 = false;
        this.numpad6 = false;
        this.numpad7 = false;
        this.numpad8 = false;
        this.numpad9 = false;
        this.multiply = false;
        this.add = false;
        this.subtract = false;
        this.decimalPoint = false;
        this.divide = false;
        this[0] = false;
        this[1] = false;
        this[2] = false;
        this[3] = false;
        this[4] = false;
        this[5] = false;
        this[6] = false;
        this[7] = false;
        this[8] = false;
        this[9] = false;
        this.a = false;
        this.b = false;
        this.c = false;
        this.d = false;
        this.e = false;
        this.f = false;
        this.g = false;
        this.h = false;
        this.i = false;
        this.j = false;
        this.k = false;
        this.l = false;
        this.m = false;
        this.n = false;
        this.o = false;
        this.p = false;
        this.q = false;
        this.r = false;
        this.s = false;
        this.t = false;
        this.u = false;
        this.v = false;
        this.w = false;
        this.x = false;
        this.y = false;
        this.z = false;
        this[KeyboardKey.keys[e.keyCode]] = true;
        if (this.metaLeft) {
            KeyboardKey.metaLeft = true;
            return;
        }
        if (this.metaRight) {
            KeyboardKey.metaLeft = false;
            return;
        }
        if (this.shift) {
            KeyboardKey.shiftLeft = e.location === 1;
            return;
        }
        if (this.ctrl) {
            KeyboardKey.ctrlLeft = e.location === 1;
            return;
        }
        if (this.alt) {
            KeyboardKey.altLeft = e.location === 1;
            return;
        }
        if (e.shiftKey) {
            this.noMod = false;
            this.shiftMod = true;
            this.shiftLeftMod = KeyboardKey.shiftLeft;
            this.shiftRightMod = !KeyboardKey.shiftLeft;
        }
        if (e.altKey) {
            this.noMod = false;
            this.altMod = true;
            this.altLeftMod = KeyboardKey.altLeft;
            this.altRightMod = !KeyboardKey.altLeft;
        }
        if (e.ctrlKey) {
            this.noMod = false;
            this.ctrlMod = true;
            this.ctrlLeftMod = KeyboardKey.ctrlLeft;
            this.ctrlRightMod = !KeyboardKey.ctrlLeft;
        }
        if (e.metaKey) {
            this.noMod = false;
            this.metaMod = true;
            this.metaLeftMod = KeyboardKey.metaLeft;
            this.metaRightMod = !KeyboardKey.metaLeft;
        }
        /*var keys = Object.keys(this);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (this[key]){
                console.log(key);
            }
        }*/
    }
    KeyboardKey.keys = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        19: 'pauseBreak',
        20: 'capsLock',
        27: 'escape',
        32: 'space',
        33: 'pageUp',
        34: 'pageDown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'insert',
        46: 'delete',
        112: 'f1',
        113: 'f2',
        114: 'f3',
        115: 'f4',
        116: 'f5',
        117: 'f6',
        118: 'f7',
        119: 'f8',
        120: 'f9',
        121: 'f10',
        122: 'f11',
        123: 'f12',
        144: 'numLock',
        145: 'scrollLock',
        186: 'semiColon',
        187: 'equalSign',
        188: 'comma',
        189: 'dash',
        190: 'period',
        191: 'forwardSlash',
        192: 'graveAccent',
        219: 'openBracket',
        220: 'backSlash',
        221: 'closeBraket',
        222: 'singleQuote',
        91: 'metaLeft',
        92: 'metaRight',
        93: 'metaRight',
        96: 'numpad0',
        97: 'numpad1',
        98: 'numpad2',
        99: 'numpad3',
        100: 'numpad4',
        101: 'numpad5',
        102: 'numpad6',
        103: 'numpad7',
        104: 'numpad8',
        105: 'numpad9',
        106: 'multiply',
        107: 'add',
        109: 'subtract',
        110: 'decimalPoint',
        111: 'divide',
        48: '0',
        49: '1',
        50: '2',
        51: '3',
        52: '4',
        53: '5',
        54: '6',
        55: '7',
        56: '8',
        57: '9',
        65: 'a',
        66: 'b',
        67: 'c',
        68: 'd',
        69: 'e',
        70: 'f',
        71: 'g',
        72: 'h',
        73: 'i',
        74: 'j',
        75: 'k',
        76: 'l',
        77: 'm',
        78: 'n',
        79: 'o',
        80: 'p',
        81: 'q',
        82: 'r',
        83: 's',
        84: 't',
        85: 'u',
        86: 'v',
        87: 'w',
        88: 'x',
        89: 'y',
        90: 'z'
    };
    KeyboardKey.shiftLeft = false;
    KeyboardKey.ctrlLeft = false;
    KeyboardKey.altLeft = false;
    KeyboardKey.metaLeft = false;
    return KeyboardKey;
})();
var editor;
(function (editor) {
    editor.config = {
        lineDuration: 2,
        audioRate: 0.8,
        lineHeight: 50,
        svgWidth: 50,
        audioWidth: 30
    };
})(editor || (editor = {}));
var LineChange = (function () {
    function LineChange(line, prevText, nextText) {
        this.line = line;
        this.prevText = prevText;
        this.nextText = nextText;
    }
    return LineChange;
})();
var Cursor = (function () {
    function Cursor() {
    }
    return Cursor;
})();
var Change = (function () {
    function Change() {
    }
    return Change;
})();
var HistoryService = (function () {
    function HistoryService() {
        this.data = [];
        this.index = 0;
    }
    HistoryService.prototype.add = function (change) {
        if (this.data.length > this.index) {
            this.data.splice(this.index);
        }
        this.data.push(change);
        this.index++;
    };
    HistoryService.prototype.forward = function () {
        if (this.index < this.data.length) {
            this.index++;
            return this.data[this.index - 1];
        }
        return null;
    };
    HistoryService.prototype.back = function () {
        if (this.index > 0) {
            this.index--;
            return this.data[this.index];
        }
        return null;
    };
    return HistoryService;
})();
var editor;
(function (editor) {
    var Events = (function () {
        function Events() {
            this.undo = new EventEmitter;
            this.redo = new EventEmitter;
            this.insertLine = new EventEmitter;
            this.appendLine = new EventEmitter;
            this.removeLine = new EventEmitter;
            this.left = new EventEmitter;
            this.down = new EventEmitter;
            this.up = new EventEmitter;
            this.right = new EventEmitter;
            this.play = new EventEmitter;
            this.stop = new EventEmitter;
            this.updateAudioSelection = new EventEmitter;
            this.linkedNegate = new EventEmitter;
            this.mouseClick = new EventEmitter();
            this.mouseDown = new EventEmitter();
        }
        return Events;
    })();
    editor.Events = Events;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var PathComponent = (function (_super) {
        __extends(PathComponent, _super);
        function PathComponent() {
            _super.apply(this, arguments);
            this.path = '';
            this.marginTop = 0;
            this.marginBottom = 0;
            this.height = 0;
            this.handleHeight = 20;
            this.halfHandlHeight = this.handleHeight / 2;
            this.handleWidth = 20;
            this.bottom = 0;
            this.top = 0;
            this.resizeKoef = 2;
            this.selecting = false;
            this.selectionStartY = 0;
            this.selectionStartTime = 0;
            this.isSelectionStartTime = false;
            this.isCutTop = false;
            this.isCutBottom = false;
        }
        //constructor(private model:Model) {}
        PathComponent.prototype.playLine = function (i) {
            var start = this.props.model.lines[i].model.lang.en.start / 100;
            var end = this.props.model.lines[i].model.lang.en.end / 100;
            this.props.model.audioSelection.play(start, end, true);
        };
        PathComponent.pathGenerator = function (topLeft, bottomLeft, topRight, bottomRight, width) {
            var bx = width / 2;
            var path = '';
            path += 'M0,' + topLeft + ' ';
            path += 'C' + bx + ',' + topLeft + ' ';
            path += bx + ',' + topRight + ' ';
            path += width + ',' + topRight + ' ';
            path += 'L' + width + ',' + bottomRight + ' ';
            path += 'C' + bx + ',' + bottomRight + ' ';
            path += bx + ',' + bottomLeft + ' ';
            path += '0,' + bottomLeft + 'Z';
            return path;
        };
        PathComponent.prototype.findTopCut = function () {
            for (var i = this.props.lineN - 1; i >= 0; i--) {
                var cl = this.props.model.collapsedLines[i];
                if (cl && cl.collapsed) {
                    return (this.props.lineN - (i + cl.length)) * -editor.config.lineHeight;
                }
            }
            return -Infinity;
        };
        PathComponent.prototype.findBottomCut = function () {
            for (var i = this.props.lineN; i < this.props.model.lines.length; i++) {
                var cl = this.props.model.collapsedLines[i];
                if (cl && cl.collapsed) {
                    return (i - this.props.lineN) * editor.config.lineHeight;
                }
            }
            return Infinity;
        };
        PathComponent.prototype.makePath = function () {
            this.isCutTop = false;
            this.isCutBottom = false;
            var lineHeight = editor.config.lineHeight;
            var secondHeight = lineHeight / editor.config.lineDuration;
            var line = this.props.model.lines[this.props.lineN];
            var end = line.model.lang.en.end / 100;
            var start = line.model.lang.en.start / 100;
            if (start) {
                var dur = (end - start);
                var leftTop = (start * secondHeight - lineHeight * this.props.lineN);
                var leftBottom = leftTop + dur * secondHeight;
                var topCut = this.findTopCut();
                var bottomCut = this.findBottomCut();
                //console.log({leftTop, topCut});
                if (leftTop < topCut) {
                    this.isCutTop = true;
                    leftTop = topCut;
                }
                if (leftBottom > bottomCut) {
                    this.isCutBottom = true;
                    leftBottom = bottomCut;
                }
                var rightTop = 0;
                var rightBottom = rightTop + lineHeight;
                var min = leftTop < rightTop ? leftTop : rightTop;
                var max = leftBottom > rightBottom ? leftBottom : rightBottom;
                min -= this.halfHandlHeight;
                max += this.halfHandlHeight;
                var marginTop = 0;
                if (min < 0) {
                    marginTop = -min;
                }
                this.height = max + marginTop;
                this.marginTop = marginTop;
                this.marginBottom = this.height > lineHeight ? this.height - lineHeight : 0;
                this.top = leftTop + marginTop;
                this.bottom = leftBottom + marginTop;
                this.path = PathComponent.pathGenerator(this.top, this.bottom, rightTop + marginTop, rightBottom + marginTop, editor.config.svgWidth);
                return true;
            }
            return false;
        };
        PathComponent.prototype.resizeTime = function (e, isStartTime) {
            var lang = this.props.model.lines[this.props.lineN].model.lang.en;
            this.selecting = true;
            this.selectionStartTime = isStartTime ? lang.start : lang.end;
            this.selectionStartY = e.pageY;
            this.isSelectionStartTime = isStartTime;
            document.body.classList.add('resize-ns');
            e.preventDefault();
        };
        PathComponent.prototype.resizeTimeMove = function (e) {
            if (this.selecting) {
                var lang = this.props.model.lines[this.props.lineN].model.lang.en;
                var diff = e.pageY - this.selectionStartY;
                if (this.isSelectionStartTime) {
                    lang.start = this.selectionStartTime + diff * this.resizeKoef;
                }
                else {
                    lang.end = this.selectionStartTime + diff * this.resizeKoef;
                }
                this.forceUpdate();
                e.preventDefault();
            }
        };
        PathComponent.prototype.resizeTimeEnd = function (e) {
            if (this.selecting) {
                this.selecting = false;
                document.body.classList.remove('resize-ns');
                var lang = this.props.model.lines[this.props.lineN].model.lang.en;
                this.props.model.audioSelection.play(lang.start / 100, lang.end / 100);
            }
        };
        PathComponent.prototype.moveTime = function (isUp, isStartTime, isEndTime) {
            var t = 30;
            var line = this.props.model.lines[this.props.model.sel.line];
            if (line.model.lang.en.start) {
                if (isStartTime) {
                    line.model.lang.en.start += isUp ? -t : t;
                }
                if (isEndTime) {
                    line.model.lang.en.end += isUp ? -t : t;
                }
                return true;
            }
            return false;
        };
        PathComponent.prototype.componentDidMount = function () {
            var _this = this;
            document.addEventListener('mousemove', function (e) { return _this.resizeTimeMove(e); });
            document.addEventListener('mouseup', function (e) { return _this.resizeTimeEnd(e); });
        };
        PathComponent.prototype.render = function () {
            var _this = this;
            if (!this.makePath()) {
                return null;
            }
            return React.DOM.svg({
                width: editor.config.svgWidth,
                height: this.height,
                style: { WebkitTransform: "translateY(-" + this.marginTop + "px)" }
            }, React.DOM.path({
                onClick: function () { return _this.playLine(_this.props.lineN); },
                stroke: "transparent",
                d: this.path,
                fill: 'hsla(' + (this.props.model.lines[this.props.lineN].model.lang.en.start / 10 | 0) + ', 50%,60%, 1)'
            }), this.isCutTop ? null :
                React.DOM.rect({
                    onMouseDown: function (e) {
                        return _this.resizeTime(e.nativeEvent, true);
                    },
                    x: 0,
                    y: this.top - this.halfHandlHeight,
                    width: 20,
                    height: 20
                }), this.isCutBottom ? null :
                React.DOM.rect({
                    onMouseDown: function (e) {
                        return _this.resizeTime(e.nativeEvent, false);
                    },
                    x: 0,
                    y: this.bottom - this.halfHandlHeight,
                    width: 20,
                    height: 20
                }));
        };
        PathComponent.prototype.render2 = function () {
            var _this = this;
            if (!this.makePath()) {
                return null;
            }
            return vd('svg', {
                width: editor.config.svgWidth,
                height: this.height,
                styles: { WebkitTransform: "translateY(-" + this.marginTop + "px)" }
            }, vd('path', {
                events: {
                    click: function () { return _this.playLine(_this.props.lineN); },
                },
                stroke: "transparent",
                d: this.path,
                fill: "hsla(" + (this.props.model.lines[this.props.lineN].model.lang.en.start / 10 | 0) + ", 50%,60%, 1)"
            }), this.isCutTop ? null :
                vd('rect', {
                    events: {
                        mousedown: function (e) { return _this.resizeTime(e, true); },
                    },
                    x: 0,
                    y: this.top - this.halfHandlHeight,
                    width: 20,
                    height: 20
                }), this.isCutBottom ? null :
                vd('rect', {
                    events: {
                        mousedown: function (e) { return _this.resizeTime(e, false); },
                    },
                    x: 0,
                    y: this.bottom - this.halfHandlHeight,
                    width: 20,
                    height: 20
                }));
        };
        return PathComponent;
    })(React.Component);
    editor.PathComponent = PathComponent;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var AudioPlayer = (function () {
        function AudioPlayer(model) {
            this.model = model;
            this.audioContext = new AudioContext();
            this.playingSources = [];
        }
        AudioPlayer.prototype.playRaw = function (start, end) {
            this.stopPlay();
            var audioData = linesStore.audioData;
            if (audioData) {
                var dur = end - start;
                if (dur) {
                    var channel = audioData.getChannelData(0);
                    var slice = channel.subarray(start * audioData.sampleRate | 0, end * audioData.sampleRate | 0);
                    console.log(start, end, slice.length / audioData.sampleRate);
                    var buff = this.audioContext.createBuffer(1, slice.length / editor.config.audioRate, audioData.sampleRate);
                    buff.getChannelData(0).set(slice);
                    var source = this.audioContext.createBufferSource();
                    source.buffer = buff;
                    source.playbackRate.value = editor.config.audioRate;
                    source.connect(this.audioContext.destination);
                    source.start(0);
                    this.playingSources.push(source);
                    return true;
                }
            }
            else {
                console.log("audioData is not loaded yet");
            }
        };
        AudioPlayer.prototype.play = function (start, end) {
            this.stopPlay();
            var lineDuration = editor.config.lineDuration;
            var startLine = start / lineDuration;
            var endLine = end / lineDuration;
            var audioData = linesStore.audioData;
            if (audioData) {
                var dur = end - start;
                if (dur) {
                    var channel = audioData.getChannelData(0);
                    var sliced = [];
                    var size = 0;
                    this.model.lines.forEach(function (line, j) {
                        if (!line.hidden) {
                            if (j >= Math.floor(startLine) && j < Math.ceil(endLine)) {
                                var addToStart = Math.max(startLine - j, 0);
                                var addToEnd = Math.floor(endLine) == j ? endLine - j : 1;
                                var slice = channel.subarray((j + addToStart) * lineDuration * audioData.sampleRate | 0, (j + addToEnd) * lineDuration * audioData.sampleRate | 0);
                                sliced.push(slice);
                                size += slice.length;
                            }
                        }
                    });
                    var buff = this.audioContext.createBuffer(audioData.numberOfChannels, size / editor.config.audioRate, audioData.sampleRate);
                    var offset = 0;
                    for (var i = 0; i < sliced.length; i++) {
                        var slice = sliced[i];
                        buff.getChannelData(0).set(slice, offset);
                        offset += slice.length;
                    }
                    var source = this.audioContext.createBufferSource();
                    source.buffer = buff;
                    source.playbackRate.value = editor.config.audioRate;
                    source.connect(this.audioContext.destination);
                    source.start(0);
                    this.playingSources.push(source);
                    return true;
                }
            }
            else {
                console.log("audioData is not loaded yet");
            }
            return false;
        };
        AudioPlayer.prototype.stopPlay = function () {
            this.playingSources.forEach(function (source) { return source.stop(); });
            this.playingSources = [];
        };
        return AudioPlayer;
    })();
    editor.AudioPlayer = AudioPlayer;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var AudioSelection = (function () {
        function AudioSelection(model) {
            this.model = model;
            this.start = 0;
            this.end = 0;
            this.status = 1 /* STOPPED */;
            this.player = new editor.AudioPlayer(this.model);
        }
        AudioSelection.prototype.clear = function () {
            this.status = 1 /* STOPPED */;
            this.start = 0;
            this.end = 0;
        };
        AudioSelection.prototype.play = function (start, end, playGaps) {
            if (playGaps === void 0) { playGaps = false; }
            this.start = start;
            this.end = end;
            this.status = 0 /* PLAYING */;
            if (playGaps) {
                this.player.playRaw(this.start, this.end);
            }
            else {
                this.player.play(this.start, this.end);
            }
        };
        AudioSelection.prototype.playCurrent = function () {
            this.status = 0 /* PLAYING */;
            this.player.play(this.start, this.end);
        };
        AudioSelection.prototype.stop = function () {
            this.status = 1 /* STOPPED */;
            this.player.stopPlay();
        };
        __decorate([
            observe
        ], AudioSelection.prototype, "start");
        __decorate([
            observe
        ], AudioSelection.prototype, "end");
        __decorate([
            observe
        ], AudioSelection.prototype, "status");
        return AudioSelection;
    })();
    editor.AudioSelection = AudioSelection;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var AudioSelectionComponent = (function (_super) {
        __extends(AudioSelectionComponent, _super);
        function AudioSelectionComponent() {
            _super.apply(this, arguments);
            this.selecting = false;
            this.selectionStart = 0;
            this.player = new editor.AudioPlayer(this.model);
            this.offsetTop = 0;
            this.startY = 0;
            this.endY = 0;
            this.model = this.props.model;
            this.audioSelection = this.props.model.audioSelection;
            this.events = this.props.events;
        }
        AudioSelectionComponent.prototype.selectStart = function (e) {
            if (e.target.classList.contains('audio')) {
                this.selecting = true;
                this.audioSelection.start = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                this.selectionStart = this.audioSelection.start;
                this.audioSelection.end = this.audioSelection.start;
                e.preventDefault();
                this.stopCurrentTime();
                this.audioSelection.stop();
                this.forceUpdate();
            }
        };
        AudioSelectionComponent.prototype.selectMove = function (e) {
            if (this.selecting) {
                var end = this.model.fromVisibleToTime(e.pageY - this.offsetTop);
                if (end <= this.selectionStart) {
                    this.audioSelection.start = end;
                    this.audioSelection.end = this.selectionStart;
                }
                else {
                    this.audioSelection.start = this.selectionStart;
                    this.audioSelection.end = end;
                }
                this.forceUpdate();
            }
        };
        AudioSelectionComponent.prototype.selectEnd = function (e) {
            if (this.selecting) {
                this.selecting = false;
                this.audioSelection.playCurrent();
                this.startCurrentTime();
                this.forceUpdate();
            }
        };
        AudioSelectionComponent.prototype.clear = function () {
            this.audioSelection.start = 0;
            this.audioSelection.end = 0;
        };
        AudioSelectionComponent.prototype.startCurrentTime = function () {
            var dur = (this.audioSelection.end - this.audioSelection.start);
            this.currentTime.style.transition = '';
            this.currentTime.style.transform = "translateY(" + this.startY + "px)";
            //noinspection BadExpressionStatementJS
            this.currentTime.offsetHeight; //force reflow
            this.currentTime.style.transition = 'all linear';
            this.currentTime.style.transform = "translateY(" + this.endY + "px)";
            this.currentTime.style.transitionDuration = dur / editor.config.audioRate + 's';
        };
        AudioSelectionComponent.prototype.stopCurrentTime = function () {
            this.currentTime.style.transition = '';
        };
        AudioSelectionComponent.prototype.componentDidMount = function () {
            var _this = this;
            /*
                        new Observer2(() => {
                            var status = this.audioSelection.status;
                            if (status == AudioSelectionState.PLAYING) {
                                this.startCurrentTime();
                            }
                            if (status == AudioSelectionState.STOPPED) {
                                this.stopCurrentTime();
                            }
                            this.forceUpdate();
                        });
                        new Observer2(() => {
                            this.startY = this.model.timeToVisibleLineN(this.audioSelection.start);
                            this.endY = this.model.timeToVisibleLineN(this.audioSelection.end);
                            this.forceUpdate();
                        });
            
            */
            this.el = React.findDOMNode(this.refs['audioSelection']);
            this.currentTime = React.findDOMNode(this.refs['currentTime']);
            this.offsetTop = this.el.parentNode.offsetTop;
            this.props.events.mouseDown.listen(function (e) { return _this.selectStart(e); });
            document.addEventListener('mousemove', function (e) { return _this.selectMove(e); });
            document.addEventListener('mouseup', function (e) { return _this.selectEnd(e); });
        };
        AudioSelectionComponent.prototype.render = function () {
            return div({ className: 'relative' }, div({
                className: 'audio-selection audio', style: {
                    top: this.startY,
                    height: this.endY - this.startY
                },
                ref: 'audioSelection'
            }), div({ className: 'current-time audio', ref: 'currentTime' }));
        };
        AudioSelectionComponent.prototype.render2 = function () {
            return vd('.relative', this.audioSelectionNode =
                vd('.audio-selection.audio', {
                    styles: {
                        top: this.startY + "px",
                        height: (this.endY - this.startY) + "px"
                    },
                }), this.currentTimeNode =
                vd('.current-time.audio'));
        };
        return AudioSelectionComponent;
    })(React.Component);
    editor.AudioSelectionComponent = AudioSelectionComponent;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var KeyManager = (function () {
        function KeyManager(events) {
            this.events = events;
        }
        KeyManager.prototype.keyManager = function (key) {
            if (key.noMod) {
                if (key.up) {
                    this.events.up.emit();
                }
                if (key.down) {
                    this.events.down.emit();
                }
                if (key.left) {
                    this.events.left.emit();
                }
                if (key.right) {
                    this.events.right.emit();
                }
                return true;
            }
            if (key.z && key.metaMod && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.undo.emit();
                return true;
            }
            if (key.z && key.metaMod && key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.redo.emit();
                return true;
            }
            if (key.enter && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                this.events.insertLine.emit();
                return true;
            }
            if (key.enter && key.shiftMod && !key.altMod && !key.ctrlMod && !key.metaMod) {
                this.events.linkedNegate.emit();
                return true;
            }
            if (key.space && key.noMod) {
                this.events.linkedNegate.emit();
                return true;
            }
            if (key.tab && key.noMod) {
                this.events.play.emit();
                return true;
            }
            if (key.backspace && !key.shiftMod && !key.altMod && !key.ctrlMod) {
                if (key.metaMod) {
                    this.events.removeLine.emit();
                }
                else {
                    this.events.appendLine.emit();
                }
                return true;
            }
            return false;
        };
        return KeyManager;
    })();
    editor.KeyManager = KeyManager;
})(editor || (editor = {}));
var editor;
(function (editor) {
    function getParents(target, top, includeTarget) {
        if (includeTarget === void 0) { includeTarget = true; }
        var node = target;
        var parents = [];
        if (includeTarget) {
            parents.push(target);
        }
        while ((node = node.parentNode) && node != top) {
            parents.push(node);
        }
        return parents;
    }
    editor.getParents = getParents;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var WordSelection = (function () {
        function WordSelection() {
            this.line = 0;
            this.pos = 0;
            this.lang = 'en';
            this.leftOffset = -1;
        }
        return WordSelection;
    })();
    editor.WordSelection = WordSelection;
    var LineView = (function () {
        function LineView(model, en, ru, oldLine) {
            this.hidden = false;
            this.mayHide = false;
            this.collapsibleCount = 0;
            this.collapsed = false;
            this.model = model;
            this.words = { en: en, ru: ru };
            if (oldLine) {
                this.hidden = oldLine.hidden;
                this.mayHide = oldLine.mayHide;
                this.collapsed = oldLine.collapsed;
                this.collapsibleCount = oldLine.collapsibleCount;
                this.path = oldLine.path;
            }
        }
        return LineView;
    })();
    editor.LineView = LineView;
    var Model = (function () {
        function Model() {
            this.sel = new WordSelection();
            this.audioSelection = new editor.AudioSelection(this);
            this.historyService = new HistoryService();
            this.collapsedLines = {};
        }
        Model.prototype.undo = function () {
            var change = this.historyService.back();
            if (change) {
                this.sel.line = change.cursorBefore.line;
                this.sel.pos = change.cursorBefore.pos;
                this.sel.leftOffset = -1;
                this.sel.lang = change.lang;
            }
        };
        Model.prototype.redo = function () {
            var change = this.historyService.forward();
            if (change) {
                this.sel.line = change.cursorAfter.line;
                this.sel.pos = change.cursorAfter.pos;
                this.sel.leftOffset = -1;
                this.sel.lang = change.lang;
            }
        };
        Model.prototype.fromVisibleToTime = function (top) {
            var k = 0;
            var top = top / editor.config.lineHeight;
            for (var i = 0; i < this.lines.length; i++) {
                var line = this.lines[i];
                if (!line.hidden) {
                    if (top < k + 1) {
                        return (i + top - k) * editor.config.lineDuration;
                    }
                    k++;
                }
            }
            return 0;
        };
        Model.prototype.timeToVisibleLineN = function (time) {
            var k = 0;
            var lineN = time / editor.config.lineDuration;
            for (var i = 0; i < this.lines.length; i++) {
                var line = this.lines[i];
                //console.log({i, k, time, hidden: line.hidden});
                if (i == Math.floor(lineN)) {
                    return (k + (line.hidden ? 0 : lineN % 1)) * editor.config.lineHeight;
                }
                if (!line.hidden) {
                    k++;
                }
            }
            return 0;
        };
        Model.prototype.showAllLines = function () {
            this.lines.forEach(function (line) { return line.hidden = false; });
        };
        Model.prototype.prepareHideLines = function () {
            var _this = this;
            var collapsed = 0;
            var start = null;
            this.lines.forEach(function (line, i) {
                if (line.model.isEmpty()) {
                    if (start == null) {
                        start = i - 1;
                    }
                    collapsed++;
                }
                else {
                    if (collapsed > 0) {
                        _this.collapsedLines[start + 1] = { collapsed: false, length: collapsed };
                    }
                    start = null;
                    collapsed = 0;
                }
            });
            console.log(this.collapsedLines);
        };
        Model.prototype.prepareData = function (linesStore) {
            var _this = this;
            this.lines = linesStore.data.map(function (line, i) {
                var en = _this.parse(line.lang.en && line.lang.en.text);
                var ru = _this.parse(line.lang.ru && line.lang.ru.text);
                var lineView = _this.lines ? _this.lines.filter(function (lineView) { return lineView.model == line; }).pop() : null;
                return new LineView(line, en, ru, lineView);
            });
            //this.sync();
            //this.syncAudioLines();
        };
        Model.prototype.parse = function (str) {
            var regexp = /([\s.]*?([-–—][ \t]+)?[\wа-яА-Я']+[^\s]*)/g;
            var m;
            var pos = 0;
            var block = [];
            while (m = regexp.exec(str)) {
                block.push(m[1]);
                pos++;
            }
            if (pos === 0) {
                block.push(' ');
            }
            return block;
        };
        Model.prototype.createLinesUntil = function (array, k) {
            for (var i = array.length; i <= k; i++) {
                array.push(new LineView(new Line(new LangItem(), new LangItem()), [], []));
            }
        };
        Model.prototype.sync = function () {
            var _this = this;
            var lines = [];
            var enLines = [];
            var ruLines = [];
            var lastUsedLineEn = -1;
            var lastUsedLineRu = -1;
            //for (var i = 0; i < linesStore.data.length; i++) {
            linesStore.data.forEach(function (model) {
                var lng = model.lang;
                if (lng.en && lng.en.start) {
                    enLines.push(lng.en);
                    var enMiddle = (lng.en.start + (lng.en.end - lng.en.start) / 2) / 100 / editor.config.lineDuration;
                    var k = Math.max(Math.round(enMiddle), lastUsedLineEn + 1);
                    lastUsedLineEn = k;
                    _this.createLinesUntil(lines, k);
                    if (lines[k].model.isEmpty()) {
                        var lineView = _this.lines ? _this.lines.filter(function (lineView) { return lineView.model == model; }).pop() : null;
                        lines[k] = new LineView(model, [], [], lineView);
                    }
                    lines[k].model.lang.en = lng.en;
                }
                if (lng.ru && lng.ru.start) {
                    ruLines.push(lng.ru);
                    var ruMiddle = (lng.ru.start + (lng.ru.end - lng.ru.start) / 2) / 100 / editor.config.lineDuration;
                    var k = Math.max(Math.round(ruMiddle), lastUsedLineRu + 1);
                    lastUsedLineRu = k;
                    _this.createLinesUntil(lines, k);
                    lines[k].model.lang.ru = lng.ru;
                    if (lines[k].model.isEmpty()) {
                        var lineView = _this.lines ? _this.lines.filter(function (lineView) { return lineView.model == model; }).pop() : null;
                        lines[k] = new LineView(model, [], [], lineView);
                    }
                    lines[k].words.ru = _this.parse(lng.ru && lng.ru.text);
                }
            });
            this.lines = lines;
        };
        return Model;
    })();
    editor.Model = Model;
})(editor || (editor = {}));
var editor;
(function (editor) {
    var Toolbar = (function () {
        function Toolbar(model, events) {
            this.model = model;
            this.events = events;
        }
        Toolbar.prototype.hideEmptyLines = function () {
            for (var fromLine in this.model.collapsedLines) {
                var collapseLine = this.model.collapsedLines[fromLine];
                var toLine = fromLine + collapseLine.length;
                for (var i = fromLine; i < toLine; i++) {
                    this.model.lines[i].hidden = !collapseLine.collapsed;
                }
                collapseLine.collapsed = !collapseLine.collapsed;
            }
        };
        return Toolbar;
    })();
    editor.Toolbar = Toolbar;
})(editor || (editor = {}));
///<reference path="config.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="Events.ts"/>
///<reference path="PathComponent.ts"/>
///<reference path="AudioPlayer.ts"/>
///<reference path="AudioSelection.ts"/>
///<reference path="AudioSelectionComponent.ts"/>
///<reference path="KeyManager.ts"/>
///<reference path="Utils.ts"/>
///<reference path="Model.ts"/>
///<reference path="Toolbar.ts"/>
var editor;
(function (editor) {
    var EditorComponent = (function (_super) {
        __extends(EditorComponent, _super);
        function EditorComponent() {
            _super.call(this, null, null);
            this.offsetTop = 0;
            this.audioHeight = 30000 / (50 * editor.config.lineDuration / editor.config.lineHeight);
            this.model = new editor.Model;
            //eventEmitter = new EventEmitter<Action>();
            this.events = new editor.Events;
            this.toolbar = new editor.Toolbar(this.model, this.events);
            this.keyManager = new editor.KeyManager(this.events);
            glob.editor = this;
        }
        EditorComponent.prototype.getSelectionOnClick = function (e) {
            var parents = editor.getParents(e.target, this.el);
            var line;
            var lang;
            var pos;
            for (var i = 0; i < parents.length; i++) {
                var node = parents[i];
                if (node.tagName == 'SPAN') {
                    pos = Array.prototype.slice.call(node.parentNode.childNodes).indexOf(node);
                }
                if (node.dataset && node.dataset['lang']) {
                    lang = node.dataset['lang'];
                }
                if (node.dataset && node.dataset['line']) {
                    line = +node.dataset['line'];
                    this.model.sel.line = line;
                    this.model.sel.lang = lang === void 0 ? 'en' : lang;
                    this.model.sel.pos = pos === void 0 ? 0 : pos;
                    return true;
                }
            }
            return false;
        };
        EditorComponent.prototype.updateCursor = function () {
            var selected = this.el.querySelector('.selected');
            if (selected) {
                selected.classList.remove('selected');
            }
            for (var _i = 0, _a = [].slice.call(this.el.querySelectorAll('.current')); _i < _a.length; _i++) {
                var current = _a[_i];
                current.classList.remove('current');
            }
            var line = this.el.querySelector("[data-line=\"" + this.model.sel.line + "\"]");
            if (line) {
                var lng = line.querySelector(".lng." + this.model.sel.lang);
                if (lng) {
                    var span = lng.querySelectorAll("span")[this.model.sel.pos];
                    if (span) {
                        //line.classList.add('current');
                        //lng.classList.add('current');
                        span.classList.add('selected');
                    }
                }
            }
        };
        EditorComponent.prototype.getCurrentLineWords = function () {
            return [].slice.call(document.querySelectorAll(".visible[data-line=\"" + this.model.sel.line + "\"] ." + this.model.sel.lang + " span"));
        };
        EditorComponent.prototype.moveCaretUpDown = function (isUp) {
            if (isUp === void 0) { isUp = false; }
            var currentLineWords = this.getCurrentLineWords();
            var currentWord = currentLineWords[this.model.sel.pos];
            if (currentWord) {
                this.setLineWhenUpDown(isUp);
                var closestWord = this.setPosToClosestNextWord(currentWord);
                var scrollTop = document.body.scrollTop;
                var scrollBottom = scrollTop + window.innerHeight;
                var wordOffsetTop = currentWord.offsetTop;
                if (isUp && wordOffsetTop < scrollTop + 70) {
                    window.scrollTo(0, scrollTop - wordOffsetTop + closestWord.offsetTop);
                }
                if (!isUp && wordOffsetTop > scrollBottom - 70) {
                    window.scrollTo(0, scrollTop + closestWord.offsetTop - wordOffsetTop);
                }
            }
            this.updateCursor();
        };
        EditorComponent.prototype.leftRight = function (left) {
            if (left === void 0) { left = false; }
            if (left && this.model.sel.pos > 0) {
                this.model.sel.pos--;
                this.model.sel.leftOffset = -1;
            }
            var lineLen = this.model.lines[this.model.sel.line].words[this.model.sel.lang].length;
            if (!left && this.model.sel.pos < lineLen - 1) {
                this.model.sel.pos++;
                this.model.sel.leftOffset = -1;
            }
            this.updateCursor();
        };
        EditorComponent.prototype.setLineWhenUpDown = function (isUp) {
            if (isUp === void 0) { isUp = false; }
            var isDown = !isUp;
            if (this.model.sel.lang == 'en') {
                if (isUp) {
                    if (this.model.sel.line == 0) {
                        return false;
                    }
                    this.model.sel.line--;
                }
                this.model.sel.lang = 'ru';
            }
            else {
                if (isDown) {
                    if (this.model.sel.line == this.model.lines.length - 1) {
                        return false;
                    }
                    this.model.sel.line++;
                }
                this.model.sel.lang = 'en';
            }
            return true;
        };
        EditorComponent.prototype.setPosToClosestNextWord = function (currentWord) {
            if (this.model.sel.leftOffset == -1) {
                this.model.sel.leftOffset = currentWord.offsetLeft;
            }
            var closest = -1;
            var closestDiff = Infinity;
            var nextWords = this.getCurrentLineWords();
            var closestNode;
            for (var i = 0; i < nextWords.length; i++) {
                var nextWord = nextWords[i];
                var diff = Math.abs(this.model.sel.leftOffset - nextWord.offsetLeft);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestNode = nextWord;
                    closest = i;
                }
            }
            if (closest > -1) {
                this.model.sel.pos = closest;
            }
            return closestNode;
        };
        EditorComponent.prototype.insertLine = function (cut) {
            if (cut === void 0) { cut = false; }
            var line = this.model.sel.line;
            var lang = this.model.sel.lang;
            var pos = this.model.sel.pos;
            var lines = this.model.lines;
            if (lines[line] && lines[line].model.lang[lang]) {
                var cutPos = lines[line].words[lang].slice(0, pos).join("").length;
                var change = linesStore.insertLine(cutPos, line, lang);
                if (change) {
                    this.model.sel.line++;
                    this.model.sel.pos = 0;
                    change.cursorBefore = { line: line, pos: pos };
                    change.cursorAfter = { line: this.model.sel.line, pos: this.model.sel.pos };
                    this.model.historyService.add(change);
                    this.forceUpdate();
                }
            }
        };
        EditorComponent.prototype.removeLine = function (append) {
            if (append === void 0) { append = false; }
            var line = this.model.sel.line;
            var lang = this.model.sel.lang;
            var pos = this.model.sel.pos;
            var prevLine = this.model.lines[line - 1];
            var prevLineIsEmpty = prevLine ? prevLine.model.lang[lang].isEmpty() : false;
            var change = linesStore.removeLine(append, line, lang);
            if (change) {
                if (prevLine) {
                    if (prevLineIsEmpty) {
                        this.model.sel.pos = 0;
                    }
                    else {
                        this.model.sel.pos = prevLine.words[lang].length;
                    }
                }
                if (append) {
                    this.model.sel.line--;
                }
                else {
                    if (this.model.sel.line === this.model.lines.length - 1) {
                        this.model.sel.line--;
                    }
                    this.model.sel.pos = 0;
                }
                change.cursorBefore = { line: line, pos: pos };
                change.cursorAfter = { line: this.model.sel.line, pos: this.model.sel.pos };
                this.model.historyService.add(change);
                this.forceUpdate();
            }
        };
        EditorComponent.prototype.linkedNegate = function () {
            //console.log("linked");
            this.model.lines[this.model.sel.line].model.linked = !this.model.lines[this.model.sel.line].model.linked;
            this.forceUpdate();
        };
        EditorComponent.prototype.collapse = function (e) {
            var el = e.target;
            if (el.dataset['collapsible']) {
                var fromLine = +el.dataset['line'];
                var collapseLine = this.model.collapsedLines[fromLine];
                var toLine = fromLine + collapseLine.length;
                for (var i = fromLine; i < toLine; i++) {
                    this.model.lines[i].hidden = !collapseLine.collapsed;
                }
                collapseLine.collapsed = !collapseLine.collapsed;
            }
            this.forceUpdate();
        };
        EditorComponent.prototype.getThumbPos = function (time) {
            //var time = this.fromVisibleToTime(i);
            var width = 100; //243
            var height = editor.config.lineHeight; //100;
            var rounded = 0; //i % 2 * 50;
            //i = (i / 2 | 0) * 2;
            return (-time % 20) * width + "px " + ((-time / 20 | 0) * height - rounded) + "px";
        };
        EditorComponent.prototype.hideEmptyLines = function () {
            for (var line in this.model.collapsedLines) {
                var fromLine = +line;
                var collapseLine = this.model.collapsedLines[fromLine];
                if (collapseLine) {
                    console.log(fromLine, collapseLine);
                    var toLine = fromLine + collapseLine.length;
                    for (var i = fromLine; i < toLine; i++) {
                        this.model.lines[i].hidden = true;
                    }
                    collapseLine.collapsed = true;
                }
            }
            this.forceUpdate();
        };
        EditorComponent.prototype.componentDidUpdate = function () {
            this.updateCursor();
        };
        EditorComponent.prototype.componentWillMount = function () {
            this.model.prepareData(linesStore);
            this.model.prepareHideLines();
        };
        EditorComponent.prototype.componentDidMount = function () {
            var _this = this;
            this.el = React.findDOMNode(this);
            this.offsetTop = this.el.offsetTop;
            document.addEventListener("keydown", function (e) {
                var key = new KeyboardKey(e);
                if (_this.keyManager.keyManager(key)) {
                    e.preventDefault();
                }
            });
            this.events.up.listen(function () { return _this.moveCaretUpDown(true); });
            this.events.down.listen(function () { return _this.moveCaretUpDown(false); });
            this.events.left.listen(function () { return _this.leftRight(true); });
            this.events.right.listen(function () { return _this.leftRight(false); });
            this.events.insertLine.listen(function () { return _this.insertLine(); });
            this.events.appendLine.listen(function () { return _this.removeLine(true); });
            this.events.removeLine.listen(function () { return _this.removeLine(false); });
            this.events.linkedNegate.listen(function () { return _this.linkedNegate(); });
            this.events.mouseClick.listen(function (e) { return _this.getSelectionOnClick(e); });
            //this.events.mouseClick.listen(e=>this.mouseClick(e));
            this.events.undo.listen(function () { return _this.model.undo(); });
            this.events.redo.listen(function () { return _this.model.redo(); });
            this.el.addEventListener('click', function (e) { return _this.events.mouseClick.emit(e); });
            this.el.addEventListener('mousedown', function (e) { return _this.events.mouseDown.emit(e); });
            this.updateCursor();
        };
        EditorComponent.prototype.render = function () {
            var _this = this;
            return div({ className: 'editor' }, div({ className: 'panel' }, React.DOM.button({ onClick: function () { return _this.hideEmptyLines(); } }, 'Hide')), React.createElement(editor.AudioSelectionComponent, {
                model: this.model,
                events: this.events
            }), this.model.lines.map(function (line, i) { return [
                div({
                    className: cx({
                        line: true,
                        hidden: line.hidden,
                        visible: !line.hidden,
                        linked: line.model.linked
                    }),
                    'data-line': i,
                    'data-may-hide': line.mayHide ? line.mayHide : void 0,
                    'data-collapsed': line.collapsed ? line.collapsed : void 0,
                    'data-collapsible-count': line.collapsibleCount ? line.collapsibleCount : void 0
                }, div({
                    className: 'thumb',
                    style: { backgroundPosition: _this.getThumbPos(i) }
                }), div({
                    className: 'audio-en audio',
                    style: {
                        backgroundPosition: 0 + 'px ' + -i * editor.config.lineHeight + 'px',
                        backgroundSize: editor.config.audioWidth + "px " + _this.audioHeight + "px"
                    }
                }), React.createElement(editor.PathComponent, {
                    model: _this.model,
                    lineN: i
                }), div({ className: 'audio-ru' }), div({ className: 'lng en', 'data-lang': 'en' }, line.words.en.map(function (block, pos) {
                    return span({}, block);
                })), div({ className: 'lng ru', 'data-lang': 'ru' }, line.words.ru.map(function (block, pos) {
                    return span({}, block);
                }))),
                _this.model.collapsedLines[i + 1] ?
                    div({
                        onClick: function (e) { return _this.collapse(e.nativeEvent); },
                        className: cx({
                            collapsible: true,
                            collapsed: _this.model.collapsedLines[i + 1].collapsed
                        }),
                        'data-collapsible': true,
                        'data-line': i + 1,
                    }) : null
            ]; }));
        };
        EditorComponent.prototype.render2 = function () {
            var _this = this;
            return vd('div.editor', vd('div.panel', vd('button', { events: { click: function () { return _this.hideEmptyLines(); } } }, 'Hide')), new editor.AudioSelectionComponent().vd({
                model: this.model,
                events: this.events
            }), this.model.lines.map(function (line, i) { return [
                vd('div.line', {
                    classes: {
                        hidden: line.hidden,
                        visible: !line.hidden,
                        linked: line.model.linked
                    },
                    dataLine: i,
                    dataMayHide: line.mayHide ? line.mayHide : void 0,
                    dataCollapsed: line.collapsed ? line.collapsed : void 0,
                    dataCollapsibleCount: line.collapsibleCount ? line.collapsibleCount : void 0
                }, vd('div.thumb', {
                    styles: { backgroundPosition: _this.getThumbPos(i) }
                }), vd('div.audio-en.audio', {
                    styles: {
                        backgroundPosition: "0px " + -i * editor.config.lineHeight + "px",
                        backgroundSize: editor.config.audioWidth + "px " + _this.audioHeight + "px"
                    }
                }), new editor.PathComponent({
                    model: _this.model,
                    lineN: i
                }), vd('.audio-ru'), vd('.lng.en', { dataLang: 'en' }, line.words.en.map(function (block, pos) {
                    return vd('span', block);
                })), vd('.lng.ru', { dataLang: 'ru' }, line.words.ru.map(function (block, pos) {
                    return vd('span', block);
                }))),
                _this.model.collapsedLines[i + 1] ?
                    vd({
                        events: {
                            click: function (e) { return _this.collapse(e); },
                        },
                        classes: {
                            collapsible: true,
                            collapsed: _this.model.collapsedLines[i + 1].collapsed
                        },
                        dataCollapsible: true,
                        dataLine: i + 1,
                    }) : void 0
            ]; }));
        };
        return EditorComponent;
    })(React.Component);
    editor.EditorComponent = EditorComponent;
})(editor || (editor = {}));
var debug;
(function (debug_1) {
    function get(obj, key) {
        return debug(true, false, obj, key);
    }
    debug_1.get = get;
    function set(obj, key) {
        return debug(false, true, obj, key);
    }
    debug_1.set = set;
    function debug(whenGet, whenSet, obj, key) {
        var pd = Object.getOwnPropertyDescriptor(obj, key);
        var ppd = {
            enumerable: true,
            configurable: true,
            get: function debugGet() {
                if (whenGet) {
                    debugger;
                }
                if (pd && pd.get) {
                    pd.get();
                }
                return obj['__' + key];
            },
            set: function debugSet(val) {
                if (whenSet) {
                    debugger;
                }
                if (pd && pd.set) {
                    pd.set(val);
                }
                obj['__' + key] = val;
            }
        };
        Object.defineProperty(obj, key, ppd);
        return ppd;
    }
})(debug || (debug = {}));
var control;
(function (control) {
    var Popup = (function (_super) {
        __extends(Popup, _super);
        function Popup() {
            _super.apply(this, arguments);
            this.closeWhenClickOut = true;
            this.closeButton = true;
            this.hasOpacity = true;
            this.styled = true;
            this.mainLeft = 0;
            this.mainTop = 0;
            this.oldPaddingRight = '';
        }
        Popup.show = function (popup) {
            popup.init({}).mount(document.body);
            return popup;
        };
        Popup.prototype.close = function () {
            document.body.classList.remove('remove-scroll');
            this.rootNode.dom.parentNode.removeChild(this.rootNode.dom);
            this.removeBodyPadding();
        };
        Popup.prototype.show = function () {
            this.setBodyPaddingRight();
            document.body.classList.add('remove-scroll');
        };
        Popup.prototype.setBodyPaddingRight = function () {
            this.oldPaddingRight = document.body.style.paddingRight;
            var computed = window.getComputedStyle(document.body);
            document.body.style.paddingRight = parseInt(computed.paddingRight, 10) + (window.innerWidth - this.rootNode.dom.offsetWidth) + 'px';
        };
        Popup.prototype.removeBodyPadding = function () {
            document.body.style.paddingRight = this.oldPaddingRight;
        };
        Popup.prototype.clickOutside = function (e) {
            if (this.closeWhenClickOut && e.target == this.rootNode.dom) {
                this.close();
            }
        };
        Popup.prototype.componentWillMount = function () {
            //todo:test for all browsers
            if (this.target) {
                var rect = this.target.getBoundingClientRect();
                this.mainLeft = rect.left;
                this.mainTop = rect.bottom;
            }
        };
        Popup.prototype.componentDidMount = function () {
            this.show();
        };
        Popup.prototype.render = function () {
            var _this = this;
            return this.rootWithAttrs({
                class: 'popup',
                classes: {
                    styled: this.styled,
                    opacity: this.hasOpacity
                },
                onclick: function (e) { return _this.clickOutside(e); }
            }, vd('.popup-main', {
                style: {
                    float: this.target ? 'left' : '',
                    position: 'relative',
                    left: this.mainLeft + 'px',
                    top: this.mainTop + 'px',
                }
            }, this.closeButton ? vd('span.close-button', { onclick: function () { return _this.close(); } }, '×') : null, this.header ? vd('.header', this.header) : null, this.body ? vd('.main', this.body) : null, this.footer ? vd('.footer', this.footer) : null));
        };
        return Popup;
    })(virtual.Component);
    control.Popup = Popup;
    var Tip = (function (_super) {
        __extends(Tip, _super);
        function Tip() {
            var _this = this;
            _super.apply(this, arguments);
            this.clickCallback = function (e) {
                var node = e.target;
                var parents = [node];
                while (node = node.parentNode) {
                    parents.push(node);
                }
                var otherTargets = _this.props.notCloseOnClick || [];
                if (parents.indexOf(_this.rootNode.dom) === -1 && otherTargets.every(function (t) { return parents.indexOf(t.dom) === -1; })) {
                    _this.props.onClose();
                }
            };
        }
        Tip.prototype.componentDidMount = function () {
            var targetRect = this.props.target.dom.getBoundingClientRect();
            var srcRect = this.rootNode.dom.getBoundingClientRect();
            this.rootNode.dom.style.marginLeft = targetRect.left - srcRect.left + 'px';
            this.rootNode.dom.style.marginTop = targetRect.bottom - srcRect.top + 'px';
            document.addEventListener('click', this.clickCallback);
        };
        Tip.prototype.componentWillUnmount = function () {
            document.removeEventListener('click', this.clickCallback);
        };
        Tip.prototype.render = function () {
            return this.rootWithAttrs({ style: { position: 'absolute' } }, this.children);
        };
        return Tip;
    })(virtual.Component);
    control.Tip = Tip;
})(control || (control = {}));
var control;
(function (control) {
    var DatePicker = (function (_super) {
        __extends(DatePicker, _super);
        function DatePicker() {
            _super.apply(this, arguments);
            this.focused = false;
        }
        DatePicker.prototype.updateAttrs = function () {
            this.model = this.props.value;
            observer.Atom.from(this.model).setListener(new observer.Listener(this.props.onChange));
            this.watch(this.modelChanged);
        };
        DatePicker.prototype.parser = function () {
            var node = this.input.dom;
            var value = node.value.trim().replace(/[^\d]+/g, '/');
            value = value.replace(/^(\d{1,2})\/(\d{1,2})\//, '$2/$1/');
            var has3DigitBlocks = value.match(/(\d{1,4})\/(\d{1,2})\/(\d{1,4})/);
            //var year4Digit = has3DigitBlocks && (has3DigitBlocks[1].length == 2 || has3DigitBlocks[1].length == 4);
            var date = new Date(value);
            if (value.length > 5 && has3DigitBlocks && isFinite(date.getTime()) && date.getFullYear() >= 1000 && date.getFullYear() < 3000) {
                this.model = date;
            }
            else {
                this.model = new Date("invalid");
            }
        };
        DatePicker.prototype.formatter = function (setEmptyIfInvalid) {
            if (setEmptyIfInvalid === void 0) { setEmptyIfInvalid = false; }
            var node = this.input.dom;
            var val = this.model;
            if (val && isFinite(val.getTime())) {
                node.value = ('0' + val.getDate()).substr(-2) + '/' + ('0' + (val.getMonth() + 1)).substr(-2) + '/' + val.getFullYear();
            }
            else if (setEmptyIfInvalid) {
                node.value = '';
            }
        };
        DatePicker.prototype.openCalendar = function () {
            this.focused = true;
        };
        DatePicker.prototype.modelChanged = function (isBlurEvent) {
            if (isBlurEvent === void 0) { isBlurEvent = false; }
            console.log("model changed", this.model);
            if (this.input && this.input.dom) {
                var node = this.input.dom;
                if (this.model) {
                    if (isFinite(this.model.getTime())) {
                        node.setCustomValidity('');
                    }
                    else {
                        node.setCustomValidity('Invalid date');
                    }
                }
                else {
                    node.setCustomValidity('');
                }
                if (node !== document.activeElement) {
                    this.formatter(!isBlurEvent);
                }
            }
        };
        DatePicker.prototype.render = function () {
            var _this = this;
            return this.root(vd('div', this.model && this.model.getTime() && this.model.toJSON()), vd('br'), this.input = vd('input', {
                type: 'text',
                required: true,
                oninput: function () { return _this.parser(); },
                onfocus: function () { return _this.openCalendar(); },
                onblur: function () { return _this.modelChanged(true); }
            }), this.button = vd('button', { events: { click: function () { return _this.openCalendar(); } } }, '*'), this.focused ?
                new control.Tip().init({
                    target: this.input,
                    notCloseOnClick: [this.input, this.button],
                    onClose: function () { return _this.focused = false; }
                }, null, new DatePickerCalendar().init({ value: this.model, onChange: function (val) { return _this.model = val; } })) : null);
        };
        __decorate([
            observe
        ], DatePicker.prototype, "model");
        __decorate([
            observe
        ], DatePicker.prototype, "focused");
        return DatePicker;
    })(virtual.Component);
    control.DatePicker = DatePicker;
    var DatePickerCalendar = (function (_super) {
        __extends(DatePickerCalendar, _super);
        function DatePickerCalendar(value, onChange) {
            _super.call(this);
            this.currentDay = DatePickerCalendar.getDayInt(new Date());
            this.days = [];
            this.model = value;
            observer.Atom.from(this.model).setListener(new observer.Listener(onChange));
            this.watch(this.modelChanged);
        }
        DatePickerCalendar.getDayInt = function (date) {
            return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        };
        DatePickerCalendar.getMonday = function (dt) {
            var date = new Date(dt.getTime());
            var weekDay = date.getDay();
            var diff = date.getDate() - weekDay + (weekDay == 0 ? -6 : 1);
            return new Date(date.setDate(diff));
        };
        DatePickerCalendar.prototype.calcDays = function () {
            this.days = [];
            var start = DatePickerCalendar.getMonday(this.firstDayOfMonth);
            for (var j = 0; j < 42; j++) {
                var week = j / 7 | 0;
                if (!this.days[week]) {
                    this.days[week] = [];
                }
                this.days[week].push(new Date(start.getTime() + j * (24 * 60 * 60 * 1000)));
            }
        };
        DatePickerCalendar.prototype.modelChanged = function () {
            var dt = this.model;
            if (dt && isFinite(dt.getTime())) {
                var dd = new Date(dt.getFullYear(), dt.getMonth(), 1);
            }
            else {
                dd = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            }
            this.firstDayOfMonth = dd;
        };
        DatePickerCalendar.prototype.move = function (pos) {
            var dt = this.firstDayOfMonth;
            var nDt = new Date(dt.getTime());
            if (pos === 1 || pos === -1) {
                nDt.setMonth(dt.getMonth() + pos);
            }
            if (pos === 0) {
                nDt = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            }
            this.firstDayOfMonth = nDt;
        };
        DatePickerCalendar.prototype.render = function () {
            var _this = this;
            this.calcDays();
            return this.root(vd('.header', vd('.month-year', DatePickerCalendar.months[this.firstDayOfMonth.getMonth()], ' ', this.firstDayOfMonth.getFullYear()), vd('.controls', vd('a.left', { events: { click: function () { return _this.move(-1); } } }, '<'), vd('a.current', { events: { click: function () { return _this.move(0); } } }, '.'), vd('a.right', { events: { click: function () { return _this.move(1); } } }, '>'))), vd('div.week-names', DatePickerCalendar.weekOrder.map(function (p) {
                return vd('.day.week-name', DatePickerCalendar.weeks[p]);
            })), this.days.map(function (week) {
                return vd('.week', week.map(function (day) {
                    return vd('.day', {
                        classes: {
                            'current': _this.currentDay === DatePickerCalendar.getDayInt(day),
                            'current-month': _this.firstDayOfMonth.getMonth() === day.getMonth(),
                            'active': _this.model && DatePickerCalendar.getDayInt(_this.model) == DatePickerCalendar.getDayInt(day)
                        },
                        events: { click: function () { return _this.model = day; } }
                    }, day.getDate());
                }));
            }));
        };
        DatePickerCalendar.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        DatePickerCalendar.weeks = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        DatePickerCalendar.weekOrder = [1, 2, 3, 4, 5, 6, 0];
        __decorate([
            observe
        ], DatePickerCalendar.prototype, "model");
        __decorate([
            observe
        ], DatePickerCalendar.prototype, "firstDayOfMonth");
        return DatePickerCalendar;
    })(virtual.Component);
    control.DatePickerCalendar = DatePickerCalendar;
})(control || (control = {}));
//new control.DatePicker().init({}).mount(document.body);
//new control.DatePickerCalendar().init().mount(document.body); 
var control;
(function (control) {
    var SelectOptGroup = (function () {
        function SelectOptGroup(text, children, disabled) {
            this.text = text;
            this.children = children;
            this.disabled = disabled;
        }
        return SelectOptGroup;
    })();
    control.SelectOptGroup = SelectOptGroup;
    var SelectOption = (function () {
        function SelectOption(text, value, disabled) {
            this.text = text;
            this.value = value;
            this.disabled = disabled;
        }
        return SelectOption;
    })();
    control.SelectOption = SelectOption;
    var SelectBase = (function (_super) {
        __extends(SelectBase, _super);
        function SelectBase() {
            _super.apply(this, arguments);
        }
        SelectBase.prototype.change = function () {
            var _this = this;
            var modelMultiple = [];
            var model = null;
            var setSelected = false;
            this.options.forEach(function (opt, i) {
                var isSelected = opt.dom.selected;
                var optVal = _this.optionValues[i];
                if (isSelected) {
                    if (!setSelected) {
                        model = optVal.value;
                        setSelected = true;
                    }
                    modelMultiple.push(optVal.value);
                }
            });
            this.props.onChange && this.props.onChange(model);
            this.props.onChangeMultiple && this.props.onChangeMultiple(modelMultiple);
        };
        SelectBase.prototype.option = function (opt) {
            var option = vd('option', {
                selected: this.props.values.indexOf(opt.value) > -1,
                disabled: opt.disabled
            }, opt.text);
            this.options.push(option);
            this.optionValues.push(opt);
            return option;
        };
        SelectBase.prototype.componentDidMount = function () {
            //workaround
            if (this.attrs['required'] && this.attrs['multiple'] && this.props.values.length == 0) {
                this.rootNode.dom.selectedIndex = -1;
            }
        };
        SelectBase.prototype.updateAttrs = function () {
            this.options = [];
            this.optionValues = [];
        };
        SelectBase.prototype.render = function () {
            var _this = this;
            return vd('select', virtual.extend({ oninput: function () { return _this.change(); } }, this.attrs), this.props.emptyLabel ?
                vd('option', {
                    value: '',
                    disabled: this.attrs['required'],
                    selected: (!this.attrs['required'] || !this.attrs['multiple']) && this.props.values.length == 0
                }, this.props.emptyLabel) : null, this.props.data.map(function (item) {
                if (item instanceof SelectOptGroup) {
                    return vd('optgroup', { label: item.text, disabled: item.disabled }, item.children.map(function (opt) { return _this.option(opt); }));
                }
                if (item instanceof SelectOption) {
                    return _this.option(item);
                }
            }));
        };
        return SelectBase;
    })(virtual.Component);
    control.SelectBase = SelectBase;
})(control || (control = {}));
var control;
(function (control) {
    var Tabs = (function (_super) {
        __extends(Tabs, _super);
        function Tabs(value) {
            _super.call(this);
            this.value = value;
            this.active = null;
            this.titles = [];
            this.values = [];
        }
        Tabs.prototype.componentWillMount = function () {
            if (this.value) {
                observer.Atom.from(this.active).sync(this.value);
            }
        };
        Tabs.prototype.getChildrenTabs = function () {
            var _this = this;
            this.titles = [];
            this.values = [];
            var firstTab = null;
            this.children.forEach(function (child) {
                if (child instanceof virtual.VNode && child.component instanceof Tab) {
                    var tab = child.component;
                    _this.titles.push(tab.props.title);
                    _this.values.push(tab.props.value);
                    if (_this.active == null && tab.props.isDefault) {
                        _this.active = tab.props.value;
                    }
                    if (tab.props.value == _this.active) {
                        _this.content = tab.rootNode;
                    }
                    if (!firstTab) {
                        firstTab = tab;
                    }
                }
            });
            if (this.active == null && firstTab) {
                this.active = this.values[0];
                this.content = firstTab.rootNode;
            }
        };
        Tabs.prototype.render = function () {
            var _this = this;
            this.getChildrenTabs();
            return this.root(this.titles.map(function (m, i) {
                return vd('button', {
                    classes: { active: _this.values[i] == _this.active },
                    type: 'button',
                    onclick: function () { return _this.active = _this.values[i]; }
                }, m);
            }), this.content);
        };
        __decorate([
            observe
        ], Tabs.prototype, "active");
        return Tabs;
    })(virtual.Component);
    control.Tabs = Tabs;
    var Tab = (function (_super) {
        __extends(Tab, _super);
        function Tab() {
            _super.apply(this, arguments);
        }
        Tab.prototype.render = function () {
            return this.root(this.children);
        };
        return Tab;
    })(virtual.Component);
    control.Tab = Tab;
})(control || (control = {}));
var control;
(function (control) {
    var AutoComplete = (function (_super) {
        __extends(AutoComplete, _super);
        function AutoComplete() {
            var _this = this;
            _super.call(this);
            this.opened = false;
            this.value = '';
            this.active = 0;
            this.defaultFilter = function (item, find) {
                return _this.props.title(item).indexOf(find) > -1;
            };
            this.defaultTemplate = function (item, find) {
                var text = _this.props.title(item);
                var pos = text.indexOf(find);
                if (pos > -1 && find.length > 0) {
                    return vd('div', text.substring(0, pos), vd('b', text.substring(pos, pos + find.length)), text.substring(pos + find.length));
                }
                return vd('div', text);
            };
            //console.log("Autocomplete Constructor", this);
        }
        AutoComplete.prototype.updateAttrs = function () {
            this.props.value = this.props.value || '';
            this.props.filter = this.props.filter || this.defaultFilter;
            this.props.template = this.props.template || this.defaultTemplate;
        };
        AutoComplete.prototype.doFilter = function () {
            var _this = this;
            return this.filtered = this.props.items.filter(function (item) { return _this.props.filter(item, _this.value); });
        };
        AutoComplete.prototype.setActiveNodeValue = function () {
            //console.log("setActiveNodeValue");
            this.inputNode.value = this.props.title(this.filtered[this.active]);
        };
        AutoComplete.prototype.select = function (item) {
            //console.log("select");
            this.value = this.props.title(item);
            this.inputNode.value = this.value;
            this.opened = false;
            this.props.onSelect && this.props.onSelect(item, this.value);
        };
        AutoComplete.prototype.open = function () {
            this.opened = true;
            this.active = 0;
        };
        AutoComplete.prototype.close = function () {
            this.opened = false;
            this.inputNode.value = this.value;
        };
        AutoComplete.prototype.keydown = function (e) {
            var key = new KeyboardKey(e);
            if (key.noMod && this.opened) {
                var last = this.filtered.length - 1;
                if (key.up) {
                    this.active = this.active == 0 ? last : this.active - 1;
                    this.setActiveNodeValue();
                    e.preventDefault();
                }
                if (key.down) {
                    this.active = this.active >= last ? 0 : this.active + 1;
                    this.setActiveNodeValue();
                    e.preventDefault();
                }
                if (key.enter) {
                    this.select(this.filtered[this.active]);
                    e.preventDefault();
                }
                if (key.escape) {
                    this.close();
                }
            }
        };
        AutoComplete.prototype.oninput = function () {
            this.value = this.input.dom.value;
            this.opened = true;
        };
        AutoComplete.prototype.componentDidMount = function () {
            //console.log("Autocompelete didmount");
            this.inputNode = this.input.dom;
        };
        AutoComplete.prototype.componentWillUnmount = function () {
            //console.log("Autocompelete componentWillUnmount");
        };
        AutoComplete.prototype.render = function () {
            //console.log("render", this.value);
            var _this = this;
            return this.root(this.input = vd('input', {
                type: 'text',
                value: this.value,
                onkeydown: function (e) { return _this.keydown(e); },
                onfocus: function () { return _this.open(); },
                oninput: function () { return _this.oninput(); },
            }), this.opened ?
                new control.Tip().init({ target: this.input, notCloseOnClick: [this.input], onClose: function () { return _this.close(); } }, null, vd('.items', this.doFilter().map(function (item, i) {
                    return vd('.item', {
                        classes: { active: i == _this.active },
                        onclick: function () { return _this.select(item); }
                    }, _this.props.template(item, _this.value));
                }))) : null);
        };
        __decorate([
            observe
        ], AutoComplete.prototype, "opened");
        __decorate([
            observe
        ], AutoComplete.prototype, "value");
        __decorate([
            observe
        ], AutoComplete.prototype, "active");
        return AutoComplete;
    })(virtual.Component);
    control.AutoComplete = AutoComplete;
})(control || (control = {}));
///<reference path="Popup.ts"/>
///<reference path="DatePicker.ts"/>
///<reference path="Select.ts"/>
///<reference path="Tab.ts"/>
///<reference path="AutoComplete.ts"/>
var control;
(function (control) {
    var InputGroup = (function (_super) {
        __extends(InputGroup, _super);
        function InputGroup() {
            _super.apply(this, arguments);
        }
        InputGroup.prototype.render = function () {
            var label = vd('span.label', this.props.label);
            return this.root(this.props.labelRight
                ? vd('label', this.children, label)
                : vd('label', label, ":", this.children));
        };
        return InputGroup;
    })(virtual.Component);
    control.InputGroup = InputGroup;
    var Checkbox = (function (_super) {
        __extends(Checkbox, _super);
        function Checkbox() {
            _super.apply(this, arguments);
        }
        Checkbox.prototype.change = function () {
            var checked = this.rootNode.dom.checked;
            this.props.onChange && this.props.onChange(checked);
        };
        Checkbox.prototype.render = function () {
            var _this = this;
            return vd('input', { type: 'checkbox', checked: this.props.checked, oninput: function () { return _this.change(); } });
        };
        return Checkbox;
    })(virtual.Component);
    control.Checkbox = Checkbox;
    var RadioItem = (function () {
        function RadioItem(label, value, disabled) {
            this.label = label;
            this.value = value;
            this.disabled = disabled;
        }
        return RadioItem;
    })();
    control.RadioItem = RadioItem;
    var RadioGroup = (function (_super) {
        __extends(RadioGroup, _super);
        function RadioGroup() {
            _super.apply(this, arguments);
            this.name = Math.random().toString(33).substr(2, 3);
        }
        RadioGroup.prototype.change = function (item) {
            this.props.onChange && this.props.onChange(item.value);
        };
        RadioGroup.prototype.render = function () {
            var _this = this;
            return this.rootWithAttrs({ class: 'radio-buttons' }, this.props.items.map(function (item) {
                return new InputGroup().init({ label: item.label, labelRight: true }, null, vd('input', {
                    type: 'radio',
                    name: _this.name,
                    checked: _this.props.value === item.value,
                    disabled: item.disabled,
                    oninput: function () { return _this.change(item); }
                }));
            }));
        };
        return RadioGroup;
    })(virtual.Component);
    control.RadioGroup = RadioGroup;
    var RadioButtons = (function (_super) {
        __extends(RadioButtons, _super);
        function RadioButtons() {
            _super.apply(this, arguments);
        }
        RadioButtons.prototype.render = function () {
            var _this = this;
            return this.rootWithAttrs({ class: 'radio-buttons' }, this.props.items.map(function (m) {
                return vd('button', {
                    type: 'button',
                    classes: { active: m == _this.active },
                    onclick: function () { return _this.active = m; }
                }, _this.props.label(m));
            }));
        };
        __decorate([
            observe
        ], RadioButtons.prototype, "active");
        return RadioButtons;
    })(virtual.Component);
    control.RadioButtons = RadioButtons;
    var Button = (function (_super) {
        __extends(Button, _super);
        function Button() {
            _super.apply(this, arguments);
        }
        Button.prototype.render = function () {
            return vd('button', virtual.extend({
                type: 'button',
                onclick: this.props.onClick
            }, this.attrs), this.props.text);
        };
        return Button;
    })(virtual.Component);
    control.Button = Button;
})(control || (control = {}));
var router;
(function (router) {
    var Route = (function () {
        //childRouts:Route<any>[] = [];
        function Route(url) {
            var _this = this;
            var parentRoutes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                parentRoutes[_i - 1] = arguments[_i];
            }
            this.names = [];
            this.isActive = false;
            this.parentRoutes = [];
            this.parentRoutes = parentRoutes;
            /*
                        for (var route of parentRoutes){
                            route.childRouts.push(route);
                        }
            */
            url = '/' + url.replace(/(^\/+|\/+$)/g, '');
            url = url === '/' ? url : url + '/';
            var m = url.match(/(:([^\/]+))/g);
            var v;
            var reg = /:([^\/]+)/g;
            while (v = reg.exec(url))
                this.names.push(v[1]);
            var r = '^' + url.replace(/(:([^\/]+))/g, '([^\/]+)') + '?$';
            this.regexp = new RegExp(r);
            this.url = url;
            this.urlChanged();
            Route.routes.push(this);
            window.addEventListener('popstate', function () { return _this.urlChanged(); }, false);
        }
        Route.prototype.urlChanged = function () {
            this.isActive = this.regexp.test(window.location.pathname);
            if (this.isActive) {
                var parents = Route.parents(this);
                for (var _i = 0; _i < parents.length; _i++) {
                    var r = parents[_i];
                    r.isActive = true;
                }
            }
        };
        Route.parents = function (r) {
            var routes = [];
            for (var _i = 0, _a = r.parentRoutes; _i < _a.length; _i++) {
                var route = _a[_i];
                routes.push(route);
                routes = routes.concat(Route.parents(route));
            }
            return routes;
        };
        Route.prototype.toURL = function (paramss) {
            var url = this.url;
            var params = paramss;
            for (var i in params) {
                var param = params[i];
                url = url.replace(':' + i, param);
            }
            return url;
        };
        Route.prototype.getParams = function () {
            var ret = {};
            var m = window.location.pathname.match(this.regexp);
            if (m) {
                for (var i = 1; i < m.length; i++) {
                    ret[this.names[i - 1]] = m[i];
                }
            }
            //console.log(ret);
            return ret;
        };
        Route.go = function (url) {
            history.pushState({}, '', url);
            for (var _i = 0, _a = Route.routes; _i < _a.length; _i++) {
                var route = _a[_i];
                route.urlChanged();
            }
        };
        Route.routes = [];
        __decorate([
            observe
        ], Route.prototype, "isActive");
        return Route;
    })();
    router.Route = Route;
})(router || (router = {}));
var MainPopup = (function (_super) {
    __extends(MainPopup, _super);
    function MainPopup() {
        _super.apply(this, arguments);
        this.body = new MainView().init({ popup: this, name: 'sdf' });
    }
    return MainPopup;
})(control.Popup);
var Linker = (function (_super) {
    __extends(Linker, _super);
    function Linker() {
        _super.apply(this, arguments);
        this.transparent = true;
    }
    Linker.prototype.click = function (e) {
        e.preventDefault();
        if (this.props.href != location.pathname) {
            router.Route.go(this.props.href);
        }
    };
    Linker.prototype.render = function () {
        var _this = this;
        return vd('a', virtual.extend({
            href: this.props.href,
            events: { click: function (e) { return _this.click(e); } }
        }, this.attrs), this.children);
    };
    return Linker;
})(virtual.Component);
var RouteView = (function (_super) {
    __extends(RouteView, _super);
    function RouteView() {
        _super.apply(this, arguments);
        this.routes = [];
        this.transparent = true;
    }
    RouteView.prototype.when = function (route, callback) {
        //todo:
        //this.routes.push({callback: callback, route: route});
        return this;
    };
    RouteView.prototype.render = function () {
        for (var _i = 0, _a = this.routes; _i < _a.length; _i++) {
            var route = _a[_i];
            if (route.route.isActive) {
                //todo
                return vd();
            }
        }
    };
    return RouteView;
})(virtual.Component);
var routes;
(function (routes) {
    routes.main = new router.Route('/main/');
    routes.profile = new router.Route('/profile/');
    routes.profileEmail = new router.Route('/profile/email/', routes.profile);
    routes.editor = new router.Route('/editor/editor2/editor2.html');
    routes.mainRouter = new RouteView()
        .when(routes.profile, ProfileView)
        .when(routes.editor, Editor);
    //.when(main, ()=>new MainView());
    routes.profileRouter = new RouteView()
        .when(routes.profileEmail, ProfileEditEmailView);
})(routes || (routes = {}));
var ListView = (function (_super) {
    __extends(ListView, _super);
    function ListView() {
        _super.apply(this, arguments);
    }
    ListView.prototype.render = function () {
        return vd();
        //todo:
        //return this.root(new routes.profileRouter().init({}));
    };
    return ListView;
})(virtual.Component);
var Editor = (function (_super) {
    __extends(Editor, _super);
    function Editor() {
        _super.apply(this, arguments);
    }
    Editor.prototype.render = function () {
        return this.root('editor');
    };
    return Editor;
})(virtual.Component);
var Counter = (function () {
    function Counter() {
        this.counter = 0;
    }
    __decorate([
        observe
    ], Counter.prototype, "counter");
    return Counter;
})();
var counter = new Counter();
var ProfileView = (function (_super) {
    __extends(ProfileView, _super);
    function ProfileView() {
        _super.apply(this, arguments);
    }
    ProfileView.prototype.click = function () {
        counter.counter++;
    };
    ProfileView.prototype.render = function () {
        var _this = this;
        return this.root('ProfileView', new control.Button().init({ text: counter.counter + '', onClick: function () { return _this.click(); } }), ' ', new Linker().init({ href: routes.profileEmail.toURL() }, null, 'profileEmail'), ' ');
    };
    return ProfileView;
})(virtual.Component);
var ProfileEditEmailView = (function (_super) {
    __extends(ProfileEditEmailView, _super);
    function ProfileEditEmailView() {
        _super.apply(this, arguments);
    }
    ProfileEditEmailView.prototype.render = function () {
        return this.root('ProfileEditEmailView');
    };
    return ProfileEditEmailView;
})(virtual.Component);
var MainView = (function (_super) {
    __extends(MainView, _super);
    function MainView() {
        _super.apply(this, arguments);
    }
    MainView.prototype.render = function () {
        var _this = this;
        return this.root('MainView', new control.DatePicker().init({}), new control.Button().init({ text: 'Close', onClick: function () { return _this.props.popup.close(); } }));
    };
    return MainView;
})(virtual.Component);
var ModelA = (function () {
    function ModelA(title) {
        this.title = title;
    }
    return ModelA;
})();
var atom = new observer.Atom();
var IndexView = (function (_super) {
    __extends(IndexView, _super);
    function IndexView() {
        _super.apply(this, arguments);
        this.selectOptions = [
            new control.SelectOption('hello', 1),
            new control.SelectOptGroup('group', [
                new control.SelectOption('world', 2)
            ])
        ];
        this.selectValues = [];
        this.isMultiple = true;
        this.radioGroups = [
            new control.RadioItem('one', 1),
            new control.RadioItem('two', 2),
            new control.RadioItem('three', 3),
        ];
        this.random = 0;
        this.autocompleteItems = [new ModelA('hello'), new ModelA('world'), new ModelA('hello world')];
    }
    IndexView.prototype.click = function () {
        control.Popup.show(new MainPopup());
    };
    IndexView.prototype.componentDidMount = function () {
        var _this = this;
        setInterval(function () {
            _this.random = Math.random();
        }, 1000);
    };
    IndexView.prototype.render = function () {
        var _this = this;
        return this.root(vd('form', 
        //new FFT().init(),
        this.random, new control.AutoComplete().init({
            items: this.autocompleteItems,
            title: function (item) { return item.title; },
            value: 'hello'
        }), new control.RadioGroup().init({ items: this.radioGroups, value: 2 }), new control.InputGroup().init({ label: 'Checkbox', labelRight: true }, null, new control.Checkbox().init({ checked: false })), vd(this.selectValues), new control.InputGroup().init({ label: 'Hello' }, null, new control.SelectBase().init({
            data: this.selectOptions,
            values: this.selectValues,
            emptyLabel: 'Select value',
            onChange: function (val) { return _this.selectValues = val ? [val] : []; }
        }, { required: false })), new control.InputGroup().init({ label: 'Hello2' }, null, new control.SelectBase().init({
            data: this.selectOptions,
            values: this.selectValues,
            emptyLabel: 'Select value',
            onChangeMultiple: function (val) { return _this.selectValues = val; }
        }, { required: true })), new control.RadioButtons().init({ items: model, label: function (m) { return m.name; }, value: atom }), new control.Tabs().init({ value: atom }, null, new control.Tab().init({ title: 'Hello', value: model[0] }, null, 'Hello world1'), new control.Tab().init({ title: 'World', value: model[1] }, null, 'Hello world2')), vd('button', 'send'), new control.Button().init({ text: 'Open Popup', onClick: function () { return _this.click(); } }), new Linker().init({ href: routes.main.toURL() }, null, 'Main'), ' ', new Linker().init({ href: routes.profile.toURL() }, null, 'Profile'), ' ', new Linker().init({ href: routes.editor.toURL() }, null, 'Editor')));
    };
    __decorate([
        observe
    ], IndexView.prototype, "selectValues");
    __decorate([
        observe
    ], IndexView.prototype, "isMultiple");
    __decorate([
        observe
    ], IndexView.prototype, "random");
    return IndexView;
})(virtual.Component);
var Model = (function () {
    function Model(name) {
        this.name = name;
    }
    return Model;
})();
var model = [new Model('hello'), new Model('world')];
new IndexView().init({}).mount(document.body);
//--<reference path="Atomic/lib/Argentum.ts"/>
///<reference path="../typings/es6-promise/es6-promise.d.ts"/>
///<reference path="lib/Observable.ts"/>
///<reference path="lib/Observer.ts"/>
///<reference path="lib/VDom.ts"/>
///<reference path="lib/EventEmitter.ts"/>
///<reference path="lib/react.d.ts" />
///<reference path="lib/HTTP.ts"/>
///<reference path="Store.ts"/>
///<reference path="lib/ReactDOM.ts"/>
///<reference path="LinesStore.ts"/>
///<reference path="lib/KeyboardKey.ts"/>
///<reference path="editor/EditorComponent.ts"/>
///<reference path="test/LinesStore.spec.ts"/>
///<reference path="lib/Observer.ts"/>
///<reference path="lib/Debug.ts"/>
///<reference path="lib/controls/Controls.ts"/>
///<reference path="lib/Router.ts"/>
var linesStore = new LinesStore();
Promise.all([
    HTTP.get('../data/enSub.srt', true),
    HTTP.get('../data/ruSub.srt', true)
]).then(function (values) {
    console.log(values);
    linesStore.parse(values[0], values[1]);
    //React.render(React.createElement(editor.EditorComponent), document.getElementById('body'));
});
HTTP.get('../data/enAudio.mp3', true, 'arraybuffer')
    .then(function (data) {
    return new Promise(function (resolve, reject) {
        return new AudioContext().decodeAudioData(data, resolve, reject);
    });
})
    .then(function (data) { return linesStore.audioData = data; });
//# sourceMappingURL=script.js.map