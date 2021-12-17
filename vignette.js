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
    bindFunction({
        maxWidthHeightRange:'maxWidthHeightText',
	radiusRange:'radiusText',
	linearGammaCheckbox:null,
	inverseCheckbox:null
    },
		 function(target, rel) {
		     drawSrcImageAndVignette(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
}

function drawSrcImageAndVignette(srcImage, srcCanvas, dstCancas, params, sync) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawVignette(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess('worker/vignette.js');

function drawVignette(srcCanvas, dstCanvas, params, sync) {
    const params_w = {
        radius     : params.radiusRange,
        linearGamma: params.linearGammaCheckbox,
        inverse    : params.inverseCheckbox,
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
