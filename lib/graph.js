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
    drawGraphBase(graph);
    drawGraphLines(graph, points);
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
	if (scale < 0.5) {
	    delta *= 100;
	} else if (scale < 1) {
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
    // clear
    canvas.width = width ; canvas.height = height;

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
