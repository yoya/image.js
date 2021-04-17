"use strict";
/*
 * 2021/04/18- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function makeblurKernel(blurKernelSize) {
    
}

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let blurKernelSize = 1;
    let blurKernel = makeKernel_PascalTriangle(blurKernelSize);
    const params = { blurKernelSize: blurKernelSize,
                     blurKernel: blurKernel };
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndMirror(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "borderRange":"borderText",
                  "blurRange":"blurText",
                  "ampRange":"ampText"},
		 function(target, rel) {
                     const blur = params.blurRange;
                     params.blurKernelSize = blur,
                     params.blurKernel = makeKernel_PascalTriangle(blur);
		     drawSrcImageAndMirror(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params );
}
function drawSrcImageAndMirror(srcImage, srcCanvas, dstCancas, params, sync) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawMirror(srcCanvas, dstCanvas, params, sync);
}
var worker = new workerProcess("worker/mirror.js");

function drawMirror(srcCanvas, dstCanvas, params, sync) {
    params.border = params.borderRange;
    params.amp = params.ampRange;
    worker.process(srcCanvas, dstCanvas, params, sync);
}
