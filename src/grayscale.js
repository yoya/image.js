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
    const dstCanvasArr = document.querySelectorAll('.dstCanvas');
    console.log(dstCanvasArr);
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    console.log(srcImage);
	    drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'colorFactorRange':'colorFactorText',
		  'linearGammaCheckbox':null
},
		 function(target, rel) {
		     drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, rel);
		 });
}

const workers = [];

function drawSrcImageAndGrayscale(srcImage, srcCanvas, dstCanvasArr, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const colorFactor = parseFloat(document.getElementById('colorFactorRange').value);
    const linearGamma = document.getElementById('linearGammaCheckbox').checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    for (let i = 0, n = dstCanvasArr.length; i < n; i++) {
	const dstCanvas = dstCanvasArr[i];
	const equation = dstCanvas.parentNode.innerText;
	console.debug('equation', equation);
	if (equation in workers) {
	    // do nothing
	} else {
	    workers[equation] = new workerProcess('worker/grayscale.js');
	}
	drawGrayscale(srcCanvas, dstCanvas, equation, colorFactor, linearGamma, sync);
    }
}

function drawGrayscale(srcCanvas, dstCanvas, equation, colorFactor, linearGamma, sync) {
    const params = { equation:equation, colorFactor:colorFactor, linearGamma:linearGamma };
    workers[equation].process(srcCanvas, dstCanvas, params, sync);
}
