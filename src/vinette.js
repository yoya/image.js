'use strict';
/*
 * 2017/06/13- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'radiusRange':'radiusText',
		  'linearGammaCheckbox':null,
		  'inverseCheckbox':null
},
		 function(target, rel) {
		     drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas, rel);
		 });
}

function drawSrcImageAndVinette(srcImage, srcCanvas, dstCancas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const radius = parseFloat(document.getElementById('radiusRange').value);
    const linearGamma = document.getElementById('linearGammaCheckbox').checked;
    const inverse = document.getElementById('inverseCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawVinette(srcCanvas, dstCanvas, radius, linearGamma, inverse, sync);
}

const worker = new workerProcess('worker/vinette.js');

function drawVinette(srcCanvas, dstCanvas, radius, linearGamma, inverse, sync) {
    const params = { radius:radius, linearGamma:linearGamma, inverse:inverse };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
