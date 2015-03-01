CodeMirror.defineMode("diff", function () {
	return {
		token: function (stream, state) {
			if (stream.sol() && stream.match(/[=#]+/)) {
				stream.skipToEnd();
				return 'string-2';
			}
			if (stream.sol() && stream.match(/\/\//)) {
				console.log("comment");
				stream.skipToEnd();
				return 'comment';
			}
			if (stream.sol() && state.newLine) {
				stream.started = true;
				state.newLine = false;
			}
			if (stream.sol() && stream.match(/^~?\d+ /)) {
				return 'timing';
			}
			if (stream.started && stream.match(/@/)) {
				//console.log("SDFASFDSSDAF");
				stream.skipToEnd();
				return 'string';
			}
			//console.log(stream, state);
			//stream.skipToEnd();
			stream.next();
			return "";
		},
		blankLine: function (state) {
			state.newLine = true;
		},
		startState: function () {
			console.log("Start State");
			return {};
		}
	};
});
CodeMirror.defineMIME("text/x-diff", "diff");