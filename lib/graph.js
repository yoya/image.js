"use strict";
// require func.js

function cssColor(r,g,b) { return "rgb("+r+","+g+","+b+")"; }

var X_MIN = -3.5, X_MAX = 3.5;
var Y_MIN = -1.2, Y_MAX = 1.2;

function scaleMap(x, y, width, height) {
    var x = ((x - X_MIN) / (X_MAX - X_MIN)) * width;
    var y = ((-y - Y_MIN) / (Y_MAX - Y_MIN)) * height;
    return [x, y];
}

function drawLine(ctx, x1, y1, x2, y2, color, lineWidth, width, height) {
    ctx.save();
    ctx.strokeStyle=color
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    [x1, y1] = scaleMap(x1, y1, width, height);
    [x2, y2] = scaleMap(x2, y2, width, height);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawLines(ctx, points, color, lineWidth, width, height) {
    ctx.save();
    ctx.strokeStyle=color
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    var [x, y] = points.slice(0, 2);
    [x, y] = scaleMap(x, y, width, height);
    ctx.moveTo(x, y);
    for (var i = 2 ; i < points.length ; i+= 2) {
	[x, y] = points.slice(i, i+2);
	[x, y] = scaleMap(x, y, width, height);
	ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawGraph(valueTable) {
    var graphCanvas = getById("graphCanvas");
    var ctx = graphCanvas.getContext("2d");
    var width = graphCanvas.width, height = graphCanvas.height;
    // clear
    graphCanvas.width = width ; graphCanvas.height = height;

    // axis
    drawLine(ctx, X_MIN, 0, X_MAX, 0, "black", 3, width, height);
    drawLine(ctx, 0, Y_MIN, 0, Y_MAX, "black", 3, width, height);
    ctx.font = "14px 'gothic'";
    ctx.fillStyle = "#808";
    for (var x = -3 ; x <= 3 ; x++) {
	drawLine(ctx, x, Y_MIN, x, Y_MAX, "black", 0.5, width, height);
	var [xx, yy] = scaleMap(x, 0, width, height);
	ctx.fillText(""+x, xx + 3, yy - 3);
    }
    for (var y = -1 ; y <= 1 ; y++) {
	drawLine(ctx, X_MIN, y, X_MAX, y, "black", 0.5, width, height);
	var [xx, yy] = scaleMap(0, y, width, height);
	if (y !== 0) {
	    ctx.fillText(""+y, xx + 3, yy - 3);
	}
    }

    // graph
    var filterType = valueTable["filterType"];
    switch (filterType) {
	case "NN":
	var color = "#f00";
	var points = [X_MIN, 0, -0.5, 0, -0.5, 1, 0.5, 1, 0.5, 0, X_MAX, 0];
	drawLines(ctx, points, color, 2, width, height);
	break;
	//
	case "BiLinear":
	var color = "#08f";
	var points = [X_MIN, 0, -1, 0, 0, 1, 1, 0, X_MAX, 0];
	drawLines(ctx, points, color, 2, width, height);
	break;
	//
	case "BiCubic":
	var b = valueTable["cubicB"];
	var c = valueTable["cubicC"];
	var coeff = cubicBCcoefficient(b, c);
	var points = [];
	var color = "#0b0";
	for (var x = X_MIN  ; x <= X_MAX ; x += 0.05) {
	    y = cubicBC(x, coeff);
	    points.push(x, y);
	}
	drawLines(ctx, points, color, 2, width, height);
	break;
	// 
	case "Lanczos":
	var lobe = valueTable["lobe"];
	var points = [];
	var color = "#fa0";
	for (var x = X_MIN  ; x <= X_MAX ; x += 0.05) {
	    y = lanczos(x, lobe);
	    points.push(x, y);
	}
	drawLines(ctx, points, color, 2, width, height);
	break;
    }
}
