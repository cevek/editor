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

        toURL(paramss:T) {
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

class Popup extends virtual.Component<any> {
    closeWhenClickOut = true;
    header:virtual.VNode;
    body:virtual.VNode;
    footer:virtual.VNode;

    remove() {
        document.body.classList.remove('remove-scroll');
        document.body.removeChild(this.rootNode.dom);
        this.removeBodyPadding();
    }

    show() {
        this.rootNode.mount(document.body);
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

    render() {
        return this.rootWithAttrs({class: 'popup', events: {click: (e)=>this.clickOutside(e)}},
            vd('.popup-main',
                vd('.header', this.header),
                vd('.main', this.body),
                vd('.footer', this.footer)
            )
        );
    }
}

class MainPopup extends Popup {
    body:virtual.VNode = new MainView().init({popup: this, name: 'sdf'})
}

class Linker extends virtual.Component<{href:string}> {
    transparent = true;

    click(e:Event) {
        e.preventDefault();
        if (this.props.href != location.pathname) {
            router.Route.go(this.props.href);
        }
    }

    render() {
        return vd('a', virtual.extend({
            href: this.props.href,
            events: {click: (e)=>this.click(e)}
        }, this.attrs), this.children);
    }
}

class RouteView extends virtual.Component<any> {
    routes:{callback: ()=>virtual.Component<any>; route: router.Route<any>}[] = [];
    transparent = true;

    when(route:router.Route<any>, callback:()=>virtual.Component<any>) {
        this.routes.push({callback: callback, route: route});
        return this;
    }

    render() {
        for (var route of this.routes) {
            if (route.route.isActive) {
                return route.callback().init(null);
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
        .when(main, ()=>new MainView());

    export var profileRouter = new RouteView()
        .when(profileEmail, ()=>new ProfileEditEmailView)

}

class ListView extends virtual.Component<any> {
    render() {
        return this.root(routes.profileRouter.init(null));
    }
}
class Editor extends virtual.Component<any> {
    render() {
        return this.root('editor');
    }
}

class Counter {
    @observe counter = 0;
}
var counter = new Counter();

class ProfileView extends virtual.Component<any> {

    click() {
        counter.counter++;
    }

    render() {
        return this.root(
            'ProfileView',
            vd('button', {events: {click: ()=>this.click()}}, counter.counter),
            ' ',
            new Linker().init({href: routes.profileEmail.toURL({})}, null, 'profileEmail'),
            ' ',
            routes.profileRouter.init(null));
    }
}

class ProfileEditEmailView extends virtual.Component<any> {
    render() {
        return this.root('ProfileEditEmailView');
    }
}

class MainView extends virtual.Component<{popup: Popup; name: string}> {
    render() {
        return this.root('MainView', vd('button', {events: {click: ()=>this.props.popup.remove()}}, 'Close'));
    }
}

var atom = new observer.Atom<Model>(null, null);
class IndexView extends virtual.Component<any> {
    click() {
        var popup = new MainPopup();
        popup.init(null);
        popup.show();
    }

    render() {
        return this.root(
            new RadioButtons<Model>().init({items: model, value: atom, label: m=>m.name}),
            new Tabs().init({value: atom}, null,
                new Tab().init({title: 'Hello', value: model[0]}, null, 'Hello world1'),
                new Tab().init({title: 'World', value: model[1]}, null, 'Hello world2')
            ),

            vd('button', {events: {click: ()=>this.click()}}, 'Open Popup'),
            new Linker().init({href: routes.main.toURL({})}, null, 'Main'),
            ' ',
            new Linker().init({href: routes.profile.toURL({})}, null, 'profile'),
            ' ',
            new Linker().init({href: routes.editor.toURL({})}, null, 'Editor'),
            routes.mainRouter.init(null)
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

class RadioButtons<T> extends virtual.Component<{items: T[]; label: (model:T)=>string; value?: observer.Atom<T>}> {
    @observe active:T;

    componentWillMount() {
        observer.Atom.from(this.active).sync(this.props.value);
    }

    render() {
        return this.rootWithAttrs({class: 'radio-buttons'},
            this.props.items.map(m =>
                vd('button', {
                    classes: {active: m == this.active},
                    events: {click: ()=>this.active = m}
                }, this.props.label(m)))
        );
    }
}

class Tabs extends virtual.Component<{value: observer.Atom<Object>}> {
    @observe active:Object = null;
    titles:string[] = [];
    values:Object[] = [];
    content:virtual.Child;

    componentWillMount() {
        observer.Atom.from(this.active).sync(this.props.value);
    }

    getChildrenTabs() {
        this.titles = [];
        this.values = [];
        var firstTab:Tab = null;
        this.children.forEach(child => {
            if (child instanceof virtual.VNode && child.component instanceof Tab) {
                var tab = <Tab>child.component;
                this.titles.push(tab.props.title);
                this.values.push(tab.props.value);
                if (this.active == null && tab.props.default) {
                    this.active = tab.props.value;
                }
                if (tab.props.value == this.active) {
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

class Tab extends virtual.Component<{title: string; value?: any; default?: boolean}> {
    componentWillMount() {
        this.props.value = this.props.value || {};
    }

    render() {
        return this.root(this.children);
    }
}

new IndexView().init(null).mount(document.body);
