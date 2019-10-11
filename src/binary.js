'use strict';
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    // console.debug(srcImage);
	    drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'thresholdRange':'thresholdText',
		  'grayscaleCheckbox':null,
		  'linearGammaCheckbox':null
},
		 function(target, rel) {
		     drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, rel);
		 });
}

function drawSrcImageAndBinary(srcImage, srcCanvas, dstCanvas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const threshold = parseFloat(document.getElementById('thresholdRange').value);
    const grayscale = document.getElementById('grayscaleCheckbox').checked;
    const linearGamma = document.getElementById('linearGammaCheckbox').checked;
    const params = {
 threshold:threshold,
		  grayscale:grayscale,
		  linearGamma:linearGamma
};
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawBinary(srcCanvas, dstCanvas, params, sync);
}

const worker = new workerProcess('worker/binary.js');

function drawBinary(srcCanvas, dstCanvas, params, sync) {
    worker.process(srcCanvas, dstCanvas, params, sync);
}
