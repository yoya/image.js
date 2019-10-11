'use strict';
/*
 * 2017/06/23- (c) yoya@awm.jp
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
    let fuzz = parseFloat(document.getElementById('fuzzRange').value);
    let margin = parseFloat(document.getElementById('marginRange').value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawTrim(srcCanvas, dstCanvas, fuzz, margin, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawTrim(srcCanvas, dstCanvas, fuzz, margin, rel);
		 });
    bindFunction({
 'fuzzRange':'fuzzText',
		  'marginRange':'marginText'
},
		 function(target, rel) {
		     fuzz = parseFloat(document.getElementById('fuzzRange').value);
		     margin = parseFloat(document.getElementById('marginRange').value);
		     drawTrim(srcCanvas, dstCanvas, fuzz, margin, rel);
		 });
}

const worker = new workerProcess('worker/trim.js');

function drawTrim(srcCanvas, dstCanvas, fuzz, margin, sync) {
    const params = { fuzz:fuzz, margin:margin };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
