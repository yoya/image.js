'use strict';

/*
 * 2017/06/13- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndVignette(srcImage, srcCanvas, dstCanvas, params, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndVignette(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "radius", "bias", "linearGamma", "inverse"]});
}

function drawSrcImageAndVignette(srcImage, srcCanvas, dstCanvas, params, sync) {
    const maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawVignette(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess('worker/vignette.js');

function drawVignette(srcCanvas, dstCanvas, params, sync) {
    const params_w = {
        radius     : params.radius,
        bias       : params.bias,
        linearGamma: params.linearGamma,
        inverse    : params.inverse,
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
