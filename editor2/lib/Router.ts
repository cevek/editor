module router {
    export class Route<T> {
        private regexp:RegExp;
        private url:string;
        private names:string[] = [];
        @observe isActive = false;
        parentRoutes:Route<any>[] = [];
        //childRouts:Route<any>[] = [];

        constructor(url:string, ...parentRoutes:Route<any>[]) {
            this.parentRoutes = parentRoutes;
            /*
                        for (var route of parentRoutes){
                            route.childRouts.push(route);
                        }
            */
            url = '/' + url.replace(/(^\/+|\/+$)/g, '');
            url = url === '/' ? url : url + '/';
            var m = url.match(/(:([^\/]+))/g);
            var v:RegExpExecArray;
            var reg = /:([^\/]+)/g;
            while (v = reg.exec(url))
                this.names.push(v[1]);
            var r = '^' + url.replace(/(:([^\/]+))/g, '([^\/]+)') + '?$';
            this.regexp = new RegExp(r);
            this.url = url;
            this.urlChanged();
            Route.routes.push(this);
            window.addEventListener('popstate', ()=>this.urlChanged(), false);
        }

        urlChanged() {
            this.isActive = this.regexp.test(window.location.pathname);
            if (this.isActive) {
                var parents = Route.parents(this);
                for (var r of parents) {
                    r.isActive = true;
                }
            }
        }

        private static parents(r:Route<any>) {
            var routes:Route<any>[] = [];
            for (var route of r.parentRoutes) {
                routes.push(route);
                routes = routes.concat(Route.parents(route));
            }
            return routes;
        }

        toURL(paramss?:T) {
            var url = this.url;
            var params = <any>paramss;
            for (var i in params) {
                var param = params[i];
                url = url.replace(':' + i, param);
            }
            return url;
        }

        getParams():T {
            var ret:any = {};
            var m = window.location.pathname.match(this.regexp);
            if (m) {
                for (var i = 1; i < m.length; i++) {
                    ret[this.names[i - 1]] = m[i];
                }
            }
            //console.log(ret);
            return ret;
        }

        static routes:Route<any>[] = [];

        static go(url:string) {
            history.pushState({}, '', url);
            for (var route of Route.routes) {
                route.urlChanged();
            }
        }
    }

    /*
     class Route {
     public fullUrl:RegExp;

     constructor(public url:string, public component:(...urlParams:string[])=>Cmp, public nestedRouter?:Router) {

     }
     }
     export class Router {
     private routes:Route[] = [];

     route(url:Rout, component:(...urlParams:string[])=>Cmp, nestedRouter?:Router) {
     //this.routes.push(new Route(url, component, nestedRouter));
     return this;
     }

     listen() {
     var routes = this.nested('^/');
     console.log(routes);
     window.addEventListener('popstate', function (e:PopStateEvent) {
     console.log(e);
     }, false);

     return this;
     }

     private nested(prefix:string) {
     var routes:Route[] = [];
     for (var i = 0; i < this.routes.length; i++) {
     var route = this.routes[i];
     var regexps = route.url.replace(/(^\/+|\/+$)/g, '') + '/';
     regexps = regexps.replace(/(:[^\/]+)/g, '([^\/]+)');
     var p = prefix + regexps;
     //regexps = regexps.replace(/\/+/g, '\/');
     route.fullUrl = new RegExp(p);
     routes.push(route);
     console.log(p, route.url);

     if (route.nestedRouter) {
     routes = routes.concat(route.nestedRouter.nested(p));
     }
     }
     return routes;
     }

     default() {
     return this;
     }
     }*/

}

class Popup extends virtual.Component {
    closeWhenClickOut = true;
    header:virtual.VNode;
    body:virtual.VNode;
    footer:virtual.VNode;

    remove() {
        document.body.classList.remove('remove-scroll');
        this.rootNode.dom.parentNode.removeChild(this.rootNode.dom);
        this.removeBodyPadding();
    }

    show() {
        //this.rootNode.mount(document.body);
        this.setBodyPaddingRight();
        document.body.classList.add('remove-scroll');
    }

    private oldPaddingRight = '';

    private setBodyPaddingRight() {
        this.oldPaddingRight = document.body.style.paddingRight;
        var computed = window.getComputedStyle(document.body);
        document.body.style.paddingRight = parseInt(computed.paddingRight, 10) + (window.innerWidth - this.rootNode.dom.offsetWidth) + 'px';
    }

    private removeBodyPadding() {
        document.body.style.paddingRight = this.oldPaddingRight;
    }

    protected clickOutside(e:Event) {
        if (this.closeWhenClickOut && e.target == this.rootNode.dom) {
            this.remove();
        }
    }

    componentDidMount() {
        this.show();
    }

    render() {
        return this.rootWithAttrs({class: 'popup', events: {click: (e)=>this.clickOutside(e)}},
            vd('.popup-main',
                this.header ? vd('.header', this.header) : null,
                this.body ? vd('.main', this.body) : null,
                this.footer ? vd('.footer', this.footer) : null
            )
        );
    }
}

class MainPopup extends Popup {
    body:virtual.VNode = new MainView(this, 'sdf').init()
}

class Linker extends virtual.Component {
    transparent = true;

    constructor(public href:string) {
        super();
    }

    click(e:Event) {
        e.preventDefault();
        if (this.href != location.pathname) {
            router.Route.go(this.href);
        }
    }

    render() {
        return vd('a', virtual.extend({
            href: this.href,
            events: {click: (e)=>this.click(e)}
        }, this.attrs), this.children);
    }
}

class RouteView extends virtual.Component {
    routes:{callback: ()=>virtual.Component; route: router.Route<any>}[] = [];
    transparent = true;

    when(route:router.Route<any>, callback:()=>virtual.Component) {
        this.routes.push({callback: callback, route: route});
        return this;
    }

    render() {
        for (var route of this.routes) {
            if (route.route.isActive) {
                return route.callback().init();
            }
        }
    }
}

module routes {
    export var main = new router.Route('/main/');
    export var profile = new router.Route('/profile/');
    export var profileEmail = new router.Route('/profile/email/', profile);
    export var editor = new router.Route('/editor/editor2/editor2.html');

    export var mainRouter:RouteView = new RouteView()
        .when(profile, ()=>new ProfileView())
        .when(editor, ()=>new Editor())
    //.when(main, ()=>new MainView());

    export var profileRouter = new RouteView()
        .when(profileEmail, ()=>new ProfileEditEmailView)

}

class ListView extends virtual.Component {
    render() {
        return this.root(routes.profileRouter.init());
    }
}
class Editor extends virtual.Component {
    render() {
        return this.root('editor');
    }
}

class Counter {
    @observe counter = 0;
}
var counter = new Counter();

class ProfileView extends virtual.Component {

    click() {
        counter.counter++;
    }

    render() {
        return this.root(
            'ProfileView',
            vd('button', {events: {click: ()=>this.click()}}, counter.counter),
            ' ',
            new Linker(routes.profileEmail.toURL()).init(null, 'profileEmail'),
            ' ',
            routes.profileRouter.init()
        );
    }
}

class ProfileEditEmailView extends virtual.Component {
    render() {
        return this.root('ProfileEditEmailView');
    }
}

class MainView extends virtual.Component {
    constructor(public popup:Popup, public name:string) {
        super();
    }

    render() {
        return this.root('MainView',
            new datepicker.DatePicker().init(),
            vd('button', {events: {click: ()=>this.popup.remove()}}, 'Close'));
    }
}

var atom = new observer.Atom<Model>();
class IndexView extends virtual.Component {
    click() {
        new MainPopup().init().mount(document.body);
    }

    selectOptions = [
        new form.SelectOption('hello', 1),
        new form.SelectOptGroup('group', [
            new form.SelectOption('world', 2)
        ])
    ];

    selectValues = [3];

    @observe isMultiple = true;

    radioGroups = [
        new form.RadioItem('one', 1),
        new form.RadioItem('two', 2),
        new form.RadioItem('three', 3),
    ];

    render() {
        return this.root(
            //new FFT().init(),
            vd('button', {onclick: ()=>this.isMultiple = false}, 'Single'),
            vd('button', {onclick: ()=>this.isMultiple = true}, 'Multiple'),
            new form.RadioGroup(this.radioGroups, 2).init(),

            new form.InputGroup('Checkbox', true).init(
                new form.Checkbox().init()
            ),
            new form.InputGroup('Hello').init(
                new form.SelectMultiple(
                    this.selectOptions,
                    this.selectValues,
                    (val) => this.selectValues = val
                ).init()),
            new RadioButtons(model, m=>m.name, atom).init(),
            new Tabs(atom).init(null,
                new Tab('Hello', model[0]).init('Hello world1'),
                new Tab('World', model[1]).init('Hello world2')
            ),

            vd('button', {events: {click: ()=>this.click()}}, 'Open Popup'),
            new Linker(routes.main.toURL()).init('Main'),
            ' ',
            new Linker(routes.profile.toURL()).init('profile'),
            ' ',
            new Linker(routes.editor.toURL()).init('Editor'),
            routes.mainRouter.init()
        );
    }
}

class Model {
    name:string;

    constructor(name:string) {
        this.name = name;
    }
}
var model:Model[] = [new Model('hello'), new Model('world')];

class RadioButtons<T> extends virtual.Component {
    @observe active:T;

    constructor(public items:T[], public label:(model:T)=>string, public value?:observer.Atom<T>) {
        super();
        if (this.value) {
            observer.Atom.from(this.active).sync(this.value);
        }
    }

    render() {
        return this.rootWithAttrs({class: 'radio-buttons'},
            this.items.map(m =>
                vd('button', {
                    classes: {active: m == this.active},
                    events: {click: ()=>this.active = m}
                }, this.label(m)))
        );
    }
}

class Tabs extends virtual.Component {
    @observe active:Object = null;
    titles:string[] = [];
    values:Object[] = [];
    content:virtual.Child;

    constructor(public value?:observer.Atom<Object>) {
        super();
    }

    componentWillMount() {
        if (this.value) {
            observer.Atom.from(this.active).sync(this.value);
        }
    }

    getChildrenTabs() {
        this.titles = [];
        this.values = [];
        var firstTab:Tab = null;
        this.children.forEach(child => {
            if (child instanceof virtual.VNode && child.component instanceof Tab) {
                var tab = <Tab>child.component;
                this.titles.push(tab.title);
                this.values.push(tab.value);
                if (this.active == null && tab.isDefault) {
                    this.active = tab.value;
                }
                if (tab.value == this.active) {
                    this.content = tab.rootNode;
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
    }

    render() {
        this.getChildrenTabs();
        return this.root(
            this.titles.map((m, i) =>
                    vd('button', {
                        classes: {active: this.values[i] == this.active},
                        events: {click: ()=>this.active = this.values[i]}
                    }, m)
            ),
            this.content
        )
    }
}

class Tab extends virtual.Component {
    constructor(public title:string, public value:any = {}, public isDefault?:boolean) {
        super();
    }

    render() {
        return this.root(this.children);
    }
}

new IndexView().init().mount(document.body);
