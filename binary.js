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
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    // console.debug(srcImage);
	    drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "thresholdRange":"thresholdText",
		  "grayscaleCheckbox":null,
		  "linearGammaCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, rel);
		 } );
}

function drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var threshold = parseFloat(document.getElementById("thresholdRange").value);
    var grayscale = document.getElementById("grayscaleCheckbox").checked;
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    var params = {threshold:threshold,
		  grayscale:grayscale,
		  linearGamma:linearGamma};
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawBinary(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/binary.js");

function drawBinary(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
