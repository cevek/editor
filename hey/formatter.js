var lines = [];
var lineHeight = 30;
var lineHalfHeight = lineHeight / 2 | 0;
function timingCenters(fromLine, toLine) {
	var timingMiddle = 0;
	var lineMiddle = 0;
	var count = toLine - fromLine;
	for (var i = fromLine; i <= toLine; i++) {
		timingMiddle += lines[i].timing.middle;
		lineMiddle += lineHeight;
	}
	timingMiddle = Math.round(timingMiddle / count);
	lineMiddle = Math.round(lineMiddle / count);
	return timingMiddle;
}
function distanceBetweenBlockCenters(fromLine, toLine) {
	var timingMiddle = 0;
	var lineMiddle = 0;
	var count = toLine - fromLine;
	for (var i = fromLine; i <= toLine; i++) {
		timingMiddle += lines[i].timing.middle;
		lineMiddle += lineHeight;
	}
	timingMiddle = Math.round(timingMiddle / count);
	lineMiddle = Math.round(lineMiddle / count);
	return Math.abs(timingMiddle - lineMiddle);
}

function distanceBetweenCenters(lineN, timingMiddle) {
	return Math.abs(timingMiddle - (lineN * lineHeight - lineHalfHeight));
}
function distanceBetweenCenters2(line1, line2, timingMiddle) {
	return Math.abs(timingMiddle - (line1 + ((line2 - line1) / 2) * lineHeight | 0));
}

function getLines(editor) {
	lines = [];
	var linesCount = editor.doc.lineCount();

	for (var i = 0; i < linesCount; i++) {
		var text = editor.doc.getLine(i);
		if (text.trim() && text !== '=') {
			lines.push({text: text, timing: getTime(text)});
		}
	}
}

function setLines(editor) {
	var text = "";
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		text += line.text + "\n";
	}
	editor.doc.setValue(text);
}

function syncLines() {
	getLines(editor);
	syncLineDown();
	setLines(editor);

	getLines(editor2);
	syncLineDown();
	setLines(editor2);

	changes();
}

function syncLineDown() {
	for (var i = 0; i < lines.length; i++) {
		var lineN = i;
		var resultLine = lineN + 1;
		var distance = 0;
		var timing = lines[lineN].timing;
		if (timing) {
			var j = lineN - 1;
			while (true) {
				//for (var j = lineN; j < lines.length; j++) {
				j++;
				var d1 = distanceBetweenCenters(j, timing.middle);
				var d2 = distanceBetweenCenters(j + 1, timing.middle);
				var d3 = distanceBetweenCenters(j + 2, timing.middle);
				//console.log(lineN, j, d1, d2, d3);
				if (d1 < d2 && d1 < d3) {
					resultLine = j;
					distance = d1;
					break;
				}
				if (d2 < d1 && d2 < d3) {
					resultLine = j + 1;
					distance = d2;
					break;
				}
			}


			for (var k = lineN; k < resultLine; k++) {
				lines.splice(lineN, 0, {text: "=", timing: null});
				i++;
			}

			console.log(i + 1, resultLine - i, distance);
/*

			if (distance > lineHeight) {
				var p = lineN;
				var prevD = Infinity;
				while (true) {
					p--;
					if (p < 0) {
						break;
					}
					if (lineIsEmpty(p)) {
						var timingMiddle = timingCenters(lineN, p);
						var d = distanceBetweenCenters2(lineN, p, timingMiddle);
						console.log("up", lineN, p, d);

						if (d < lineHeight || prevD < d) {
							console.log("break up");
							break;
						}

						lines.splice(p, 1);
						//p--;
						i--;
						lineN--;

						prevD = d;
					}
				}
			}
*/
		}

	}

}

function lineIsEmpty(lineN) {
	return lines[lineN].text === '=' || !lines[lineN].text.trim();
}

function syncLinesUp(lineN) {
	var p = lineN;
	var prevD = Infinity;
	while (true) {
		p--;
		if (p < 0) {
			break;
		}
		if (lineIsEmpty(p)) {
			var timingMiddle = timingCenters(lineN, p);
			var d = distanceBetweenCenters2(lineN, p, timingMiddle);
			console.log("up", lineN, p, d);

			if (d < lineHeight || prevD < d) {
				console.log("break up");
				break;
			}

			lines.splice(p, 1);
			p--;
			lineN--;

			prevD = d;
		}
	}
}