"use strict";
/*
* 2016/11/13- yoya@awm.jp . All Rights Reserved.
*/

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "filterType", "scale", "cubicBRange", "cubicCRange", "lobeRange"]});
    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, params, true);
}

var worker = new workerProcess("worker/rescale.js");

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, params, sync) {
    // console.debug("drawSrcImageAndRescale", params);
    var maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params_w = {
	filterType: params["filterType"],
	scale: params.scale,
        cubicB: params["cubicBRange"],
        cubicC: params["cubicCRange"],
        lobe  : params["lobeRange"],
    };
    drawFilterGraph(params_w);
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}

function drawFilterGraph(params) {
    var graphCanvas = document.getElementById("graphCanvas");
    var x_min = -4.2, x_max = 4.2;
    var y_min = -1.2, y_max = 1.2;
    var filterType = params["filterType"];
    switch (filterType) {
	case "NN":
	var color = "#f00";
	var points = [x_min, 0, -0.5, 0, -0.5, 1, 0.5, 1, 0.5, 0, x_max, 0];
	break;
	//
	case "BiLinear":
	var color = "#08f";
	var points = [x_min, 0, -1, 0, 0, 1, 1, 0, x_max, 0];
	break;
	//
	case "BiCubic":
	var b = params["cubicB"];
	var c = params["cubicC"];
	var coeff = cubicBCcoefficient(b, c);
	var points = [];
	var color = "#0b0";
	for (var x = x_min  ; x <= x_max ; x += 0.05) {
	    var y = cubicBC(x, coeff);
	    points.push(x, y);
	}
	break;
	//
	case "Lanczos":
	var lobe = params["lobe"];
	var points = [];
	var color = "#fa0";
	for (var x = x_min  ; x <= x_max ; x += 0.05) {
	    var y = lanczos(x, lobe);
	    points.push(x, y);
	}
	break;
    }
    var graph ={
	canvas:graphCanvas,
	lineColor:color,
	lineWidth:2,
	x_range:[x_min, x_max],
	y_range:[y_min, y_max]
    };
    drawGraph(graph, points);
}
