'use strict';
/*
 * 2018/12/12- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'thresholdSelect': null
},
		 function(target, rel) {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, rel);
		 });
 }
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, sync) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const threshold = document.getElementById('thresholdSelect').value;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawLB(srcCanvas, dstCanvas, threshold, sync);
}

const worker = new workerProcess('worker/lb.js');

function drawLB(srcCanvas, dstCanvas, threshold, sync) {
    const params = { threshold:threshold };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
