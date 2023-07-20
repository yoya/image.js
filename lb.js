"use strict";
/*
 * 2018/12/12- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image();
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage.onload = function() {
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeight":"maxWidthHeightText",
		  "thresholdMethod": null,
                  "maxLuminance":"maxLuminanceText",
                  "minLuminance":"minLuminanceText"},
		 function(target, rel) {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
 }
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
    drawLB(srcCanvas, dstCanvas, params, sync);
}


var worker = new workerProcess("worker/lb.js");

function drawLB(srcCanvas, dstCanvas, params, sync) {
    var _params = { params: params };
    worker.process(srcCanvas, dstCanvas, _params, sync);
}
