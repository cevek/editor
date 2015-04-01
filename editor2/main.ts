//--<reference path="Atomic/lib/Argentum.ts"/>
///<reference path="react.d.ts" />
///<reference path="DOM.ts" />
///<reference path="HTTP.ts"/>
///<reference path="Store.ts"/>
///<reference path="ReactDOM.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="editor.ts"/>
///<reference path="KeyManager.ts"/>
///<reference path="view.ts"/>
///<reference path="test/LinesStore.spec.ts"/>
///<reference path="Observer.ts"/>


function copy(obj:any, to:any) {
    if (obj) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            to[key] = obj[key];
        }
    }
    return to;
}
