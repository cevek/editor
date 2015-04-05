/// <reference path="../typings/es6-promise/es6-promise.d.ts"/>

class HTTP {
    static request<T>(method:string, url:string, data?:any) {
        return new Promise<T>((resolve, reject)=> {
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
                    } else {
                        reject(req);
                    }
                }
            };
            req.send(data);
        });
    }

    static requestRaw<T>(method:string, url:string, data?:any, responseType?:string) {
        return new Promise<T>((resolve, reject)=> {
            var req = new XMLHttpRequest();
            req.open(method, url, true);
            if (responseType) {
                req.responseType = responseType;
            }
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
                    if (req.status == 200) {
                        resolve(req.response);
                    } else {
                        reject(req);
                    }
                }
            };
            req.send(data);
        });
    }

    static get<T>(url:string, raw = false, responseType?:string) {
        return raw ? HTTP.requestRaw<T>('GET', url, null, responseType) : HTTP.request<T>('GET', url);
    }
}