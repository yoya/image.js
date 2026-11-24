"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "color", "vignette", "mosaic", "smoothing"]});
}
function drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas, params, sync) {
    const maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/showa.js");

function drawShowa(srcCanvas, dstCanvas, params, sync) {
    //console.debug("drawShowa:", params);
    var params_w = {
        color    : params.color,
        vignette : params.vignette,
        mosaic   : params.mosaic,
        smoothing: params.smoothing
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
