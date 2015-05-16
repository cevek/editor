module debug {
    export function get(obj:any, key:string) {
        return debug(true, false, obj, key);
    }

    export function set(obj:any, key:string) {
        return debug(false, true, obj, key);
    }

    function debug(whenGet:boolean, whenSet:boolean, obj:any, key:string) {
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
            set: function debugSet(val:any) {
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
}
