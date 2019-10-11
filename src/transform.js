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
    let rotateRoundCenter = document.getElementById('rotateRoundCenterCheckbox').checked;
    let outfill = document.getElementById('outfillSelect').value;
    outfill = outfillStyleNumber(outfill);
    let affinMatrix = [1, 0, 0,
		       0, 1, 0,
		       0, 0, 1];
    const affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = makeAffinMatrix(srcCanvas, rotateRoundCenter);
	    setTableValues('affinMatrixTable', affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, true);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'rotateRoundCenterCheckbox':null,
		  'rotateRange':'rotateText',
		  'transXRange':'transXText',
		  'transYRange':'transYText',
		  'outfillSelect':null
},
		 function(target, rel) {
		     // console.debug("bindFunction:", target.id, rel);
		     const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);

		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     rotateRoundCenter = document.getElementById('rotateRoundCenterCheckbox').checked;
		     outfill = document.getElementById('outfillSelect').value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = makeAffinMatrix(srcCanvas, rotateRoundCenter);
		     setTableValues('affinMatrixTable', affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, rel);
		 });
    //
    bindTableFunction('affinMatrixTable', function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill);
    }, affinMatrix, affinWindow);
}

function makeAffinMatrix(canvas, rotateRoundCenter) {
    const width = canvas.width; const height = canvas.height;
    const rotate = parseFloat(document.getElementById('rotateRange').value);
    const transX = parseFloat(document.getElementById('transXRange').value);
    const transY = parseFloat(document.getElementById('transYRange').value);
    const theta = 2 * Math.PI * rotate / 360;
    const mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
    let leftX, topY;
    mat[2] = transX * width;
    mat[5] = transY * height;
    if (rotateRoundCenter) {
	const hypotenuse = Math.sqrt(width * width + height * height);
	mat[2] += (-mat[0] * width - mat[1] * height + hypotenuse) / 2;
	mat[5] += (-mat[3] * width - mat[4] * height + hypotenuse) / 2;
    }
    return mat;
}

const worker = new workerProcess('worker/transform.js');

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateRoundCenter, outfill, sync) {
    const params = {
affinMatrix:affinMatrix,
		  rotateRoundCenter:rotateRoundCenter,
outfill:outfill
};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
