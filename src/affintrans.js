'use strict';
/*
 * 2017/04/21- (c) yoya@awm.jp
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
    const affinMatrixTable = document.getElementById('affinMatrixTable');
    let affin = document.getElementById('affinSelect').value;
    let outfill = document.getElementById('outfillSelect').value;
    outfill = outfillStyleNumber(outfill);
    let affinMatrix = affin2Matrix(affin, srcCanvas);
    const affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = affin2Matrix(affin, srcCanvas);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function(target, rel) {
		     const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill, rel);
		 });
    bindFunction({ 'affinSelect':null, 'outfillSelect':null },
		 function(target, rel) {
		     affin = document.getElementById('affinSelect').value;
		     outfill = document.getElementById('outfillSelect').value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = affin2Matrix(affin, srcCanvas);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill, rel);
		     setTableValues('affinMatrixTable', affinMatrix);
		 });
    //
    bindTableFunction('affinMatrixTable', function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill, true);
    }, affinMatrix, affinWindow);
}

function affin2Matrix(affin, canvas) {
    let mat = null;
    switch (affin) {
    case 'ident':
	mat = [1, 0, 0,
	       0, 1, 0,
	       0, 0, 1];
	break;
    case 'scale2':
	mat = [2, 0, 0,
	       0, 2, 0,
	       0, 0, 1];
	break;
    case 'scale0.5':
	mat = [0.5, 0, 0,
	       0, 0.5, 0,
	       0,   0, 1];
	break;
    case 'skew0.2x':
	mat = [1, 0.2, 0,
	       0, 1,   0,
	       0, 0,   1];
	break;
    case 'skew0.2y':
	mat = [1,   0, 0,
	       0.2, 1, 0,
	       0,   0, 1];
	break;
    case 'flop':
	mat = [-1, 0, canvas.width,
	       0,  1, 0,
	       0,  0, 1];
	break;
    case 'flip':
	mat = [1,  0, 0,
	       0, -1, canvas.height,
	       0,  0, 1];
	break;
    case 'rotate45':
	var theta = Math.PI / 4;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
	mat[2] = -mat[1] * canvas.height; // minX
	break;
    case 'rotate90':
	var theta = Math.PI / 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.height,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
	break;
    case 'rotate180':
	var theta = Math.PI / 2 * 2;
	mat = [Math.cos(theta), -Math.sin(theta), canvas.width,
	       Math.sin(theta),  Math.cos(theta), canvas.height,
	       0, 0, 1];
	break;
    case 'rotate270':
	var theta = Math.PI / 2 * 3;
	mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), canvas.width,
	       0, 0, 1];
	break;
    default:
	console.error('Invalid affin:' + affin);
	break;
    }
    return mat;
}

const worker = new workerProcess('worker/affintrans.js');

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, outfill, sync) {
    const params = { affinMatrix:affinMatrix, outfill:outfill };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
