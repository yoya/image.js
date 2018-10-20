"use strict";
// require func.js

function cssColor(r,g,b) { return "rgb("+r+","+g+","+b+")"; }

function scaleMap(x, y, width, height, x_range, y_range) {
    var [x_min, x_max] = x_range;
    var [y_min, y_max] = y_range;
    var x = ((x - x_min) / (x_max - x_min)) * width;
    var y = ((y_max - y) / (y_max - y_min)) * height;
    return [x, y];
}

function drawLine(ctx, x1, y1, x2, y2, color, lineWidth, width, height,
		  x_range, y_range) {
    ctx.save();
    ctx.strokeStyle=color
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    [x1, y1] = scaleMap(x1, y1, width, height, x_range, y_range);
    [x2, y2] = scaleMap(x2, y2, width, height, x_range, y_range);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawLines(ctx, points, color, lineWidth, width, height,
		   x_range, y_range) {
    ctx.save();
    ctx.strokeStyle=color
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    var [x, y] = points.slice(0, 2);
    [x, y] = scaleMap(x, y, width, height, x_range, y_range);
    ctx.moveTo(x, y);
    for (var i = 2 ; i < points.length ; i+= 2) {
	[x, y] = points.slice(i, i+2);
	[x, y] = scaleMap(x, y, width, height, x_range, y_range);
	ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawGraph(points, color, x_range, y_range) {
    drawGraphBase(points, x_range, y_range);
    drawGraphLines(points, color, x_range, y_range);
}

function drawGraphBase(points, x_range, y_range) {
    var [x_min, x_max] = x_range;
    var [y_min, y_max] = y_range;
    var graphCanvas = document.getElementById("graphCanvas");
    var ctx = graphCanvas.getContext("2d");
    var width = graphCanvas.width, height = graphCanvas.height;
    // clear
    graphCanvas.width = width ; graphCanvas.height = height;

    // axis
    drawLine(ctx, x_min, 0, x_max, 0, "black", 3, width, height,
	     x_range, y_range);
    drawLine(ctx, 0, y_min, 0, y_max, "black", 3, width, height,
	     x_range, y_range);
    ctx.font = "14px 'gothic'";
    ctx.fillStyle = "#808";
    for (var x = Math.ceil(x_min) ; x <= Math.floor(x_max) ; x++) {
	drawLine(ctx, x, y_min, x, y_max, "black", 0.5, width, height,
		 x_range, y_range);
	var [xx, yy] = scaleMap(x, 0, width, height, x_range, y_range);
	ctx.fillText(""+x, xx + 3, yy - 3);
    }
    for (var y = Math.ceil(y_min) ; y <= Math.floor(y_max) ; y++) {
	drawLine(ctx, x_min, y, x_max, y, "black", 0.5, width, height,
		 x_range, y_range);
	var [xx, yy] = scaleMap(0, y, width, height, x_range, y_range);
	if (y !== 0) {
	    ctx.fillText(""+y, xx + 3, yy - 3);
	}
    }
}

function drawGraphLines(points, color, x_range, y_range) {
    var canvas = document.getElementById("graphCanvas");
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    drawLines(ctx, points, color, 2, width, height, x_range, y_range);
}
