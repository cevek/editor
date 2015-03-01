var timeX = 20;
function getTime(line) {
	if (!Number.isFinite(+line.substr(0, 9))){
		return null;
	}
	var hours = +line.substr(0, 2);
	var mins = +line.substr(2, 2);
	var sec = +line.substr(4, 2);
	var dsec = +line.substr(6, 1);
	var dur = (line.substr(7, 2) / 10) * timeX | 0;

	var from = (mins * 60 + sec + dsec / 10 - (12 * 60 + 8)) * timeX | 0;
	return {from: from, dur: dur, to: from + dur, middle: (from + dur / 2) | 0}
}

function changes() {
	var svgC = '';
	var lineHeight = 31.6;
	var linesCount = editor.doc.lineCount();
	var firstTime = 0;
	for (var i = 0; i < linesCount; i++) {
		var line = editor.doc.getLine(i);
		var hours = +line.substr(0, 2);
		var mins = +line.substr(2, 2);
		var sec = +line.substr(4, 2);
		var dsec = +line.substr(6, 1);
		var dur = +line.substr(7, 2) / 10;


		var from = mins * 60 + sec + dsec / 10;
		if (!firstTime) {
			firstTime = from;
		}
		//var to = from + dur / 10;
		if (from) {
			svgC += '<path onclick="play(' + (from) + ',' + dur + ')" d="' + pathGenerator((from - firstTime) * timeX, dur * timeX, editor.charCoords({line: i}).top - 65, lineHeight, 50) +
			'" stroke="transparent" fill="hsla(' + (from * 77 | 0) + ', 50%,60%, 1)"/>';
		}
	}
	svg.innerHTML = svgC;
}
function play(from, dur) {
	from = from - (12 * 60 + .5);
	console.log(from, dur);
	audio.play();
	audio.currentTime = from;
	audio.playbackRate = .8;
	setTimeout(function () {
		audio.pause();
	}, dur * 1250);

}

function pathGenerator(topLeft, leftHeight, topRight, rightHeight, width) {
	var bx = width / 2 | 0;
	var path = '';
	path += 'M0,' + topLeft + ' ';

	path += 'C' + bx + ',' + topLeft + ' ';
	path += bx + ',' + topRight + ' ';
	path += width + ',' + topRight + ' ';

	path += 'L' + width + ',' + (topRight + rightHeight) + ' ';

	path += 'C' + bx + ',' + (topRight + rightHeight) + ' ';
	path += bx + ',' + (topLeft + leftHeight) + ' ';
	path += '0,' + (topLeft + leftHeight) + 'Z';
	return path;
}