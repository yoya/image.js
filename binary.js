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
	    console.log(srcImage);
	    drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "thresholdRange":"thresholdText",
		  "linearGammaCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, rel);
		 } );
}

function drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var threshold = parseFloat(document.getElementById("thresholdRange").value);
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawBinary(srcCanvas, dstCanvas, threshold, linearGamma, sync);
}

var worker = new workerProcess("worker/binary.js");

function drawBinary(srcCanvas, dstCanvas, threshold, linearGamma, sync) {
    var params = {threshold:threshold, linearGamma:linearGamma};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
