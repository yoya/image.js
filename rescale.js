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
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "filterType":null,
		  "scaleRange":"scaleText",
		  "cubicBRange":"cubicBText",
		  "cubicCRange":"cubicCText",
		  "lobeRange":"lobeText"},
		 function(target, rel) {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, rel);
		 } );
    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, false);
}

var worker = new workerProcess("worker/rescale.js");

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);    
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params = {
	filterType: document.getElementById("filterType").value,
	scale: parseFloat(document.getElementById("scaleRange").value),
	cubicB:parseFloat(document.getElementById("cubicBRange").value),
	cubicC:parseFloat(document.getElementById("cubicCRange").value),
	lobe:  parseFloat(document.getElementById("lobeRange").value)
    };
    drawFilterGraph(params);
    worker.process(srcCanvas, dstCanvas, params, sync);
}

function drawFilterGraph(params) {
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
    drawGraph(points, color, [x_min, x_max], [y_min, y_max]);
}
