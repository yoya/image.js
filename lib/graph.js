"use strict";
// require func.js

function cssColor(r,g,b) { return "rgb("+r+","+g+","+b+")"; }

function scaleMap(graph, x, y, width, height) {
    var [x_min, x_max] = graph.x_range;
    var [y_min, y_max] = graph.y_range;
    var x = ((x - x_min) / (x_max - x_min)) * width;
    var y = ((y_max - y) / (y_max - y_min)) * height;
    return [x, y];
}

function drawLine(graph, ctx, x1, y1, x2, y2, color, lineWidth, width, height,
		 ) {
    var x_range = graph.x_range;
    var y_range = graph.y_range;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    [x1, y1] = scaleMap(graph, x1, y1, width, height);
    [x2, y2] = scaleMap(graph, x2, y2, width, height);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawLines(graph, ctx, points, width, height) {
    var lineColor = graph.lineColor;
    var lineWidth = graph.lineWidth;
    var x_range = graph.x_range;
    var y_range = graph.y_range;
    var lineType = graph.lineType?graph.lineType:"line";
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    if (lineType == "line") {
	var [x, y] = points.slice(0, 2);
	[x, y] = scaleMap(graph, x, y, width, height);
	ctx.moveTo(x, y);
	for (var i = 2 ; i < points.length ; i+= 2) {
	    [x, y] = points.slice(i, i+2);
	    [x, y] = scaleMap(graph, x, y, width, height);
	    ctx.lineTo(x, y);
	}
    } else if (lineType == "lines") {
	for (var i = 0 ; i < points.length ; i+= 4) {
	    var [x1, y1, x2, y2] = points.slice(i, i+4);
	    [x1, y1] = scaleMap(graph, x1, y1, width, height);
	    [x2, y2] = scaleMap(graph, x2, y2, width, height);
	    ctx.moveTo(x1, y1);
	    ctx.lineTo(x2, y2);
	}
    }
    ctx.stroke();
    ctx.restore();
}

function drawGraph(graph, points) {
    // clear
    graph.canvas.width = graph.canvas.width;
    if (graph.drawType == "points") {
        drawGraphPoints(graph, points);
    } else {
        drawGraphLines(graph, points);
    }
    drawGraphBase(graph);
}

function drawGraphAxisDelta(range, size) { // size = width or height
    var delta = 1;
    var [min, max] = range;
    var scale = size / (max - min);
    if (100 < scale) {
	if (200 < scale) {
	    delta *= 0.1;
	} else {
	    delta *= 0.5;
	}
    } else if (scale < 5) {
	if (scale < 1) {
	    delta *= 100;
	} else if (scale < 2) {
	    delta *= 50;
	} else {
	    delta *= 10;
	}
    }
    return delta;
}

function drawGraphBase(graph) {
    var canvas = graph.canvas;
    var x_range = graph.x_range;
    var y_range = graph.y_range;
    var [x_min, x_max] = x_range;
    var [y_min, y_max] = y_range;
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;

    // axis
    drawLine(graph, ctx, x_min, 0, x_max, 0, "black", 3, width, height);
    drawLine(graph, ctx, 0, y_min, 0, y_max, "black", 3, width, height);
    ctx.font = "14px 'gothic'";
    ctx.fillStyle = "#808";
    var dx = drawGraphAxisDelta(x_range, width);
    var dy = drawGraphAxisDelta(y_range, height);
    var x = 0, y = 0;
    for ( ; x > Math.ceil(x_min) ; x-= dx);
    for ( ; y > Math.ceil(y_min) ; y-= dy);
    for ( ; x <= Math.floor(x_max) ; x+=dx) {
	drawLine(graph, ctx, x, y_min, x, y_max, "black", 0.5, width, height);
	var [xx, yy] = scaleMap(graph, x, 0, width, height);
	ctx.fillText(""+x, xx + 3, yy - 3);
    }
    for ( ; y <= Math.floor(y_max) ; y+=dy) {
	drawLine(graph, ctx, x_min, y, x_max, y, "black", 0.5, width, height);
	var [xx, yy] = scaleMap(graph, 0, y, width, height);
	if (y !== 0) {
	    ctx.fillText(""+y, xx + 3, yy - 3);
	}
    }
}

function drawGraphLines(graph, points) {
    var canvas = graph.canvas;
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    drawLines(graph, ctx, points, width, height);
}

function drawGraphPoints(graph, points) {
    var canvas = graph.canvas;
    var rgba = graph.rgbaColor;
    var width = canvas.width, height = canvas.height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    for (var i = 0, n = points.length ; i < n ; i++) {
	var point = points[i];
        var [x, y] = point;
	[x, y] = scaleMap(graph, x, y, width, height);
        if (points.length > 2) {
            rgba = point[2]
        }
	addRGBA(imageData, Math.round(x), Math.round(y), rgba);
    }
    ctx.putImageData(imageData, 0, 0);
}


/*
  utility 
*/

function drawCurveGraphBase(canvas, caption) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;
    canvas.style.backgroundColor = "#444";
    canvas.width  = width;
    // draw asix
    ctx.lineWidth = 1;
    for (var i = 0 ; i <= 10 ; i++) {
	var xy = i * width / 10;
	if (i%5 === 0){
	    ctx.strokeStyle= "lightgray";
	} else {
	    ctx.strokeStyle= "gray";
	}
	ctx.beginPath();
	ctx.moveTo(0, xy);
	ctx.lineTo(width, xy);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(xy, 0);
	ctx.lineTo(xy, height);
	ctx.stroke();
    }
    ctx.fillStyle= "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(caption, width/2, 0);
    ctx.stroke();
}

function drawParaCurveGraphBase(canvas, caption) {
    drawCurveGraphBase(canvas, caption);
}

function drawCurveGraphLine(canvas, data, color) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;
    // draw Curve
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.strokeStyle= color;
    ctx.moveTo(0, height-1);
    if (data['Count'] === 1) {
	var gamma = data['Gamma'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width;
	    var yy = Math.pow(xx, gamma)
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    } else {
	var values = data['Values'];
	for (var i = 0 , n = values.length; i < n ; i++) {
	    var xx = i / n;
	    var yy = values[i] / 0xFFFF;
	    var x = xx * width;
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
    }
    ctx.stroke();
}

function drawParaCurveGraphLine(canvas, data, color) {
    var ctx = canvas.getContext("2d");
    var width  = canvas.width
    var height = canvas.height;

    // draw Curve
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.strokeStyle= color;
    ctx.moveTo(0, height-1);
    switch (data['FunctionType']) {
    case 0:
	var [g] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width;
	    var yy = Math.pow(xx, g);
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 1:
	var [g, a, b] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= (-b/a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = 0;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 2:
	var [g, a, b, c] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= (-b/a)) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = c;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 3:
	var [g, a, b, c, d] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= d) {
		yy = Math.pow(a * xx + b, g);
	    } else {
		yy = c * xx;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    case 4:
	var [g, a, b, c, d, e, f] = data['Values'];
	for (var x = 0 ; x < width ; x++) {
	    var xx = x/width, yy;
	    if (xx >= d) {
		yy = Math.pow(a * xx + b, g) + c;
	    } else {
		yy = e * xx + f;
	    }
	    var y = yy * height;
	    ctx.lineTo(x, height - y - 1);
	}
	break;
    }
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // ctx.fillText(caption, width/2, 0);
}
