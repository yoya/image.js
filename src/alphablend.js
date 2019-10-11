'use strict';
/*
 * 2017/04/27- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas1 = document.getElementById('srcCanvas1');
    const srcCanvas2 = document.getElementById('srcCanvas2');
    const srcCanvas1Container = document.getElementById('srcCanvas1Container');
    const srcCanvas2Container = document.getElementById('srcCanvas2Container');
    const dstCanvas = document.getElementById('dstCanvas');
    let maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    let linearGamma = document.getElementById('linearGammaCheckbox').checked;
    const ratioRange  = document.getElementById('ratioRange');
    const ratio1Range = document.getElementById('ratio1Range');
    const ratio2Range = document.getElementById('ratio2Range');
    const ratioText  = document.getElementById('ratioText');
    const ratio1Text = document.getElementById('ratio1Text');
    const ratio2Text = document.getElementById('ratio2Text');
    //
    let srcImage1 = new Image(srcCanvas1.width, srcCanvas1.height);
    let srcImage2 = new Image(srcCanvas2.width, srcCanvas2.height);

    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	    drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas);
	};
	srcImage1.src = dataURL;
    }, 'DataURL');
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	    drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
			   linearGamma, true);
	};
	srcImage2.src = dataURL;
    }, 'DataURL');

    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'linearGammaCheckbox':null,
		  'ratioRange':'ratioText',
		  'ratio1Range':'ratio1Text',
		  'ratio2Range':'ratio2Text'
},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     linearGamma = document.getElementById('linearGammaCheckbox').checked;
		     if ((target.id === 'ratioRange') || (target.id === 'ratioText')) {
			 const ratio = parseFloat(ratioRange.value);
			 ratio1Range.value = ratio1Text.value = 1 - ratio;
			 ratio2Range.value = ratio2Text.value = ratio;
		     }
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
				    linearGamma, rel);
		 });
    bindFunction({ 'methodSelect':null },
		 function(target, rel) {
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
				    linearGamma, true);
		 });
}

const  worker = new workerProcess('worker/alphablend.js');

function drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, linearGamma, sync) {
    // console.debug("drawAlphaBrend")
    const method = document.getElementById('methodSelect').value;
    const ratio1 = parseFloat(document.getElementById('ratio1Range').value);
    const ratio2 = parseFloat(document.getElementById('ratio2Range').value);
    const srcCtx1 = srcCanvas1.getContext('2d');
    const srcCtx2 = srcCanvas2.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth1 = srcCanvas1.width; const srcHeight1 = srcCanvas1.height;
    const srcWidth2 = srcCanvas2.width; const srcHeight2 = srcCanvas2.height;
    const dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    const dstHeight = (srcHeight1 < srcHeight2) ? srcHeight1 : srcHeight2;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    const srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);
    //
    const params = {
method:method,
ratio1:ratio1,
ratio2:ratio2,
		  linearGamma:linearGamma
};
    worker.process([srcCanvas1, srcCanvas2], dstCanvas, params, sync);
}
