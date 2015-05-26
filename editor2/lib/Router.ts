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

class MainPopup extends control.Popup {
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
            new control.Button(counter.counter + '', ()=>this.click()).init(),
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
    constructor(public popup:control.Popup, public name:string) {
        super();
    }

    render() {
        return this.root('MainView',
            new control.DatePicker().init(),
            new control.Button('Close', ()=>this.popup.close()).init()
        );
    }
}

class ModelA {
    title:string;

    constructor(title:string) {
        this.title = title;
    }
}

var atom = new observer.Atom<Model>();
class IndexView extends virtual.Component {
    click() {
        control.Popup.show(new MainPopup());
    }

    selectOptions = [
        new control.SelectOption('hello', 1),
        new control.SelectOptGroup('group', [
            new control.SelectOption('world', 2)
        ])
    ];

    @observe selectValues:number[] = [];

    @observe isMultiple = true;

    radioGroups = [
        new control.RadioItem('one', 1),
        new control.RadioItem('two', 2),
        new control.RadioItem('three', 3),
    ];

    autocompleteItems = [new ModelA('hello'), new ModelA('world'), new ModelA('hello world')];

    render() {
        return this.root(
            vd('form',
                //new FFT().init(),
                new control.AutoComplete(this.autocompleteItems, (item)=>item.title, 'hello').init(),
                new control.RadioGroup(this.radioGroups, 2).init(),

                new control.InputGroup('Checkbox', true).init(
                    new control.Checkbox().init()
                ),
                vd(this.selectValues),
                new control.InputGroup('Hello').init(
                    new control.Select(
                        this.selectOptions,
                        this.selectValues[0],
                        'Select value',
                        (val) => this.selectValues = val ? [val] : []
                    ).init({required: false})),
                new control.InputGroup('Hello2').init(
                    new control.SelectMultiple(
                        this.selectOptions,
                        this.selectValues,
                        'Select value',
                        (val) => this.selectValues = val
                    ).init({required: true})),
                new control.InputGroup('Hello3').init(
                    new control.SelectMultiple(
                        this.selectOptions,
                        this.selectValues,
                        //null,
                        'Select value',
                        (val) => this.selectValues = val
                    ).init({required: false})),
                new control.RadioButtons(model, m=>m.name, atom).init(),
                new control.Tabs(atom).init(null,
                    new control.Tab('Hello', model[0]).init('Hello world1'),
                    new control.Tab('World', model[1]).init('Hello world2')
                ),

                vd('button', 'send'),
                new control.Button('Open Popup', ()=>this.click()).init(),
                new Linker(routes.main.toURL()).init('Main'),
                ' ',
                new Linker(routes.profile.toURL()).init('profile'),
                ' ',
                new Linker(routes.editor.toURL()).init('Editor'),
                routes.mainRouter.init()
            )
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

new IndexView().init().mount(document.body);
