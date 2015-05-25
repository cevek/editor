//--<reference path="Atomic/lib/Argentum.ts"/>
///<reference path="../typings/es6-promise/es6-promise.d.ts"/>
///<reference path="lib/Observable.ts"/>
///<reference path="lib/Observer.ts"/>
///<reference path="lib/VDom.ts"/>
///<reference path="lib/EventEmitter.ts"/>
///<reference path="lib/react.d.ts" />
//==/<reference path="expiriments/DOM.ts" />
///<reference path="lib/HTTP.ts"/>
///<reference path="Store.ts"/>
///<reference path="lib/ReactDOM.ts"/>
///<reference path="LinesStore.ts"/>
///<reference path="lib/KeyboardKey.ts"/>
///<reference path="editor/EditorComponent.ts"/>
///<reference path="test/LinesStore.spec.ts"/>
///<reference path="lib/Observer.ts"/>
///<reference path="lib/Debug.ts"/>
///<reference path="lib/Form.ts"/>
///<reference path="lib/Router.ts"/>
///<reference path="lib/DatePicker.ts"/>



var linesStore = new LinesStore();
Promise.all([
    HTTP.get<string>('../data/enSub.srt', true),
    HTTP.get<string>('../data/ruSub.srt', true)
]).then((values)=> {
    console.log(values);

    linesStore.parse(values[0], values[1]);
    //React.render(React.createElement(editor.EditorComponent), document.getElementById('body'));
});

HTTP.get<ArrayBuffer>('../data/enAudio.mp3', true, 'arraybuffer')
    .then((data)=>
        new Promise<AudioBuffer>((resolve, reject)=>
            new AudioContext().decodeAudioData(data, resolve, reject)))
    .then((data)=>linesStore.audioData = data);
