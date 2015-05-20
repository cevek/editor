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

    export class Linker extends Component1<{href:string}> {
        transparent = true;

        click(e:Event) {
            e.preventDefault();
            Route.go(this.attrs['href']);
        }

        render() {
            return vd('a', extendAttrs({events: {click: (e)=>this.click(e)}}, this.attrs), this.children);
        }
    }

    class RouteView extends Component1<any> {
        routes:{callback: ()=>Component1<any>; route: Route<any>}[] = [];
        transparent = true;

        when(route:Route<any>, callback:()=>Component1<any>) {
            this.routes.push({callback: callback, route: route});
            return this;
        }

        render() {
            for (var route of this.routes) {
                if (route.route.isActive) {
                    return route.callback().vd();
                }
            }
        }
    }

    module routes {
        export var main = new Route('/main/');
        export var profile = new Route('/profile/');
        export var profileEmail = new Route('/profile/email/', profile);
        export var editor = new Route('/editor/editor2/editor2.html');

        export var mainRouter:RouteView = new RouteView()
            .when(profile, ()=>new ProfileView())
            .when(editor, ()=>new Editor())
            .when(main, ()=>new MainView());

        export var profileRouter = new RouteView()
            .when(profileEmail, ()=>new ProfileEditEmailView)

    }

    class ListView extends Component1<any> {
        render() {
            return this.root(routes.profileRouter.vd());
        }
    }
    class Editor extends Component1<any> {
        render() {
            return this.root('editor');
        }
    }

    class ProfileView extends Component1<any> {
        render() {
            return this.root(
                'ProfileView',
                ' ',
                new Linker().vd({href: routes.profileEmail.toURL({})}, null, 'profileEmail'),
                ' ',
                routes.profileRouter.vd());
        }
    }

    class ProfileEditEmailView extends Component1<any> {
        render() {
            return this.root('ProfileEditEmailView');
        }
    }

    class MainView extends Component1<any> {
        render() {
            return this.root('MainView');
        }
    }

    class IndexView extends Component1<any> {
        render() {
            return this.root(
                new Linker().vd({href: routes.main.toURL({})}, null, 'Main'),
                ' ',
                new Linker().vd({href: routes.profile.toURL({})}, null, 'profile'),
                ' ',
                new Linker().vd({href: routes.editor.toURL({})}, null, 'Editor'),
                routes.mainRouter.vd()
            );
        }
    }

    document.body.appendChild(new IndexView().vd().dom);
}

