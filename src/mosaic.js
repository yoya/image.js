'use strict';
/*
 * 2017/06/22- (c) yoya@awm.jp
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
    let blockSize = parseFloat(document.getElementById('blockSizeRange').value);
    let blockType = document.getElementById('blockTypeSelect').value;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMosaic(srcCanvas, dstCanvas, blockSize, blockType, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType, rel);
		 });
    bindFunction({
'blockSizeRange':'blockSizeText',
		  'blockTypeSelect':null
},
		 function(target, rel) {
		     blockSize = parseFloat(document.getElementById('blockSizeRange').value);
		     blockType = document.getElementById('blockTypeSelect').value;
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType, rel);
		 });
}

const worker = new workerProcess('worker/mosaic.js');

function drawMosaic(srcCanvas, dstCanvas, blockSize, blockType, sync) {
    const params = { blockSize:blockSize, blockType:blockType };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
