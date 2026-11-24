"use strict";
/*
 * 2018/12/03- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "threshold"]});
 }
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, sync) {
    var maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawLBP(srcCanvas, dstCanvas, params, sync);
}


var worker = new workerProcess("worker/lbp.js");

function drawLBP(srcCanvas, dstCanvas, params, sync) {
    var params_w = {
        threshold: params.threshold,
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
