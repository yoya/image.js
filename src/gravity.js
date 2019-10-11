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
    var gravityTable = document.getElementById('gravityTable');
    let gravity = 5; // center
    let dstWidth = parseFloat(document.getElementById('dstWidthRange').value);
    let dstHeight = parseFloat(document.getElementById('dstHeightRange').value);
    let outfill = document.getElementById('outfillSelect').value;
    outfill = outfillStyleNumber(outfill);

    const drawImageAndGravity = function(rel) {
	const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	dstWidth  = srcCanvas.width;
	dstHeight = srcCanvas.height;
	document.getElementById('dstWidthRange').value = dstWidth;
	document.getElementById('dstWidthText').value  = dstWidth;
	document.getElementById('dstHeightRange').value = dstHeight;
	document.getElementById('dstHeightText').value  = dstHeight;
	drawGravity(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill, rel);
    };
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = drawImageAndGravity;
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     drawImageAndGravity(rel);
		 });
    bindFunction({
'dstWidthRange':'dstWidthText',
		  'dstHeightRange':'dstHeightText',
		  'outfillSelect':null
},
		 function(target, rel) {
		     dstWidth = parseFloat(document.getElementById('dstWidthRange').value);
		     dstHeight = parseFloat(document.getElementById('dstHeightRange').value);
		     outfill = document.getElementById('outfillSelect').value;
		     outfill = outfillStyleNumber(outfill);
		     drawGravity(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill, rel);
		 });
    var gravityTable = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    gravityTable[gravity - 1] = 1;
    bindTableFunction('gravityTable', function(table, values, width) {
	// console.debug(values, width);
	for (gravity = 1; gravity <= width * width; gravity++) {
	    if (values[gravity - 1]) { // 1 origin;
		break;
	    }
	}
	// console.debug(gravity);
	drawGravity(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill, true);
    }, gravityTable, 3, 'radio');
}

const worker = new workerProcess('worker/gravity.js');

function drawGravity(srcCanvas, dstCanvas, dstWidth, dstHeight, gravity, outfill, sync) {
    const params = {
 gravity:gravity,
dstWidth:dstWidth,
dstHeight:dstHeight,
		  outfill:outfill
};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
