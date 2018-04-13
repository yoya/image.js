"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvasArr = document.querySelectorAll(".dstCanvas");
    console.log(dstCanvasArr);
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    console.log(srcImage);
	    drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "grayscaleRange":"grayscaleText",
		  "linearGammaCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, rel);
		 } );
}

var workers = [];

function drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var grayscale = parseFloat(document.getElementById("grayscaleRange").value);
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    for (var i = 0, n = dstCanvasArr.length ; i < n ; i++) {
	var dstCanvas = dstCanvasArr[i];
	var equation = dstCanvas.parentNode.innerText;
	console.debug("equation", equation);
	if (equation in workers) {
	    // do nothing
	} else {
	    workers[equation] = new workerProcess("worker/grayscale.js");
	}
	drawGrayscale(srcCanvas, dstCanvas, equation, grayscale, linearGamma, sync);
    }
}

function drawGrayscale(srcCanvas, dstCanvas, equation, grayscale, linearGamma, sync) {
    var params = {equation:equation, grayscale:grayscale, linearGamma:linearGamma};
    workers[equation].process(srcCanvas, dstCanvas, params, sync);
}
