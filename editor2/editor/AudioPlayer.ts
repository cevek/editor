module editor {

    export class AudioPlayer {
        audioContext = new AudioContext();
        playingSources:AudioBufferSourceNode[] = [];

        constructor(private model:Model) {}

        play(start:number, end: number) {
            this.stopPlay();
            var lineDuration = config.lineDuration;
            var startLine = start / lineDuration;
            var endLine = end / lineDuration;
            var audioData = linesStore.audioData;
            if (audioData) {
                var dur = end - start;
                if (dur) {
                    console.log("play", start, end, dur);

                    var channel = audioData.getChannelData(0);

                    var sliced:Float32Array[] = [];
                    var size = 0;
                    this.model.lines.forEach((line, j) => {
                        if (!line.hidden) {
                            if (j >= Math.floor(startLine) && j < Math.ceil(endLine)) {
                                var addToStart = Math.max(startLine - j, 0);
                                var addToEnd = Math.floor(endLine) == j ? endLine - j : 1;
                                var slice = channel.subarray((j + addToStart) * lineDuration * audioData.sampleRate | 0,
                                    (j + addToEnd) * lineDuration * audioData.sampleRate | 0);
                                sliced.push(slice);
                                size += slice.length;
                            }
                        }
                    });
                    var buff = this.audioContext.createBuffer(audioData.numberOfChannels, size, audioData.sampleRate);
                    var offset = 0;
                    for (var i = 0; i < sliced.length; i++) {
                        var slice = sliced[i];
                        buff.getChannelData(0).set(slice, offset);
                        offset += slice.length;
                    }
                    var source = this.audioContext.createBufferSource();
                    source.buffer = buff;
                    source.playbackRate.value = config.audioRate;
                    source.connect(this.audioContext.destination);
                    source.start(0);
                    this.playingSources.push(source);
                    return true;
                }
            }

            else {
                console.log("audioData is not loaded yet");
            }
            return false;
        }

        stopPlay() {
            this.playingSources.forEach(source=>source.stop());
            this.playingSources = [];
        }
    }
}