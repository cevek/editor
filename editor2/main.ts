//--<reference path="Atomic/lib/Argentum.ts"/>
///<reference path="EventEmitter.ts"/>
///<reference path="react.d.ts" />
///<reference path="DOM.ts" />
///<reference path="HTTP.ts"/>
///<reference path="Store.ts"/>
///<reference path="ReactDOM.ts"/>
///<reference path="HistoryService.ts"/>
///<reference path="LinesStore.ts"/>
///<reference path="KeyboardKey.ts"/>
///<reference path="editor/EditorView.ts"/>
///<reference path="test/LinesStore.spec.ts"/>
///<reference path="Observer.ts"/>
///<reference path="../typings/webaudioapi/waa.d.ts"/>


var linesStore = new LinesStore();
Promise.all([
    HTTP.get<string>('../data/enSub.srt', true),
    HTTP.get<string>('../data/ruSub.srt', true)
]).then((values)=> {
    console.log(values);

    linesStore.parse(values[0], values[1]);
    React.render(React.createElement(editor.EditorView), document.getElementById('body'));
});

HTTP.get<ArrayBuffer>('../data/enAudio.mp3', true, 'arraybuffer')
    .then((data)=>
        new Promise<AudioBuffer>((resolve, reject)=>
            new AudioContext().decodeAudioData(data, resolve, reject)))
    .then((data)=>linesStore.audioData = data);
