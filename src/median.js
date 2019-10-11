'use strict';
/*
 * 2017/04/16- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    let filter = document.getElementById('filterSelect').value;
    let filterWindow = parseFloat(document.getElementById('filterWindowRange').value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'filterSelect':null, 'filterWindowRange':'filterWindowText' },
		 function(target, rel) {
		     filter = document.getElementById('filterSelect').value;
		     filterWindow = parseFloat(document.getElementById('filterWindowRange').value);
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, rel);
		 });
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, rel);
		 });
}

const worker = new workerProcess('worker/median.js');

function drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, sync) {
    const params = { filter:filter, filterWindow:filterWindow };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
