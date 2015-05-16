module router {
    export class Router {
        static activeRoute:Route<any>;
        static currentUrl:string;
        static routes:Route<any>[] = [];

        static urlChanged() {
            var route = Router.routes.filter(route => route.is(location.pathname)).pop();
            if (route) {
                Router.currentUrl = location.pathname;
            }
            Router.activeRoute = route;
            console.log(route);
        }

        static addRoute(route:Route<any>) {
            Router.routes.push(route);
        }

        static listen() {
            Router.urlChanged();
            window.addEventListener('popstate', Router.urlChanged, false);
        }
    }

    export class Route<T> {
        private regexp:RegExp;
        private url:string;
        private names:string[] = [];
        @observe isActive:boolean;

        constructor(url:string) {
            url = '/' + url.replace(/(^\/+|\/+$)/g, '');
            url = url === '/' ? url : url + '/';
            var m = url.match(/(:([^\/]+))/g);
            var v:RegExpExecArray;
            var reg = /:([^\/]+)/g;
            while (v = reg.exec(url))
                this.names.push(v[1]);
            var r = '^' + url.replace(/(:([^\/]+))/g, '([^\/]+)') + '$';
            this.regexp = new RegExp(r);
            this.url = url;
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

        is(url:string) {
            return this.regexp.test(url);
        }

        getParams():T {
            var ret:any = {};
            var m = Router.currentUrl.match(this.regexp);
            if (m) {
                for (var i = 1; i < m.length; i++) {
                    ret[this.names[i - 1]] = m[i];
                }
            }
            //console.log(ret);
            return ret;
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

    /*    export class Link {
            constructor(private attrs:Attrs, private children:any) {
                this.attrs.onclick = e=> this.click(e)
            }

            click(e:Event) {
                e.preventDefault();
                history.pushState(this.attrs['state'], '', this.attrs.href);
                Route.urlChanged();
            }

            render() {
                return vd('a', this.attrs, this.children);
            }
        }*/

    class Routes extends Component1<vd.Attrs> {
        routes:{callback: ()=>Component1<vd.Attrs>; route: Route<any>}[] = [];

        when(route:Route<any>, callback:()=>Component1<vd.Attrs>) {
            this.routes.push({callback: callback, route: route});
            Router.addRoute(route);
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
        export var profileEmail = new Route('/profile/email/');

        export var mainRouter:Routes = new Routes()
            .when(profile, ()=>new ProfileView())
            .when(profileEmail, ()=>new ProfileEditEmailView())
            .when(main, ()=>new MainView);

        export var profileRouter = new Routes()
            .when(profileEmail, ()=>new ProfileEditEmailView)
    }

    class ListView extends Component1<vd.Attrs> {
        render() {
            return routes.profileRouter.vd();
        }
    }

    class ProfileView extends Component1<vd.Attrs> {

    }

    class ProfileEditEmailView extends Component1<vd.Attrs> {

    }

    class MainView extends Component1<vd.Attrs> {
        render() {
            return routes.mainRouter.vd();
        }
    }

}

