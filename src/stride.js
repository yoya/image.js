'use strict';
/*
 * 2018/08/28- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const maxWidthHeightRange = document.getElementById('maxWidthHeightRange');
    const strideRange = document.getElementById('strideRange');
    const strideText = document.getElementById('strideText');
    let maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    let stride = parseFloat(strideRange.value);

    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    stride = srcCanvas.width;
	    strideRange.value = strideText.value = stride;
	    drawStride(srcCanvas, dstCanvas, stride);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'strideRange':'strideText'
},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(maxWidthHeightRange.value);
		     stride = parseFloat(strideRange.value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     if ((target.id === 'maxWidthHeightRange') ||
			 (target.id === 'maxWidthHeightText')) {
			 strideRange.value = strideText.value = srcCanvas.width;
		     }
		     drawStride(srcCanvas, dstCanvas, stride);
		 });
}

function drawStride(srcCanvas, dstCanvas, stride) {
    // console.debug("drawCopy");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth  = stride;
    const dstHeight = Math.ceil(srcWidth * srcHeight / stride);
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    // https://stackoverflow.com/questions/35563529/how-to-copy-typedarray-into-another-typedarray
    dstImageData.data.set(srcImageData.data); // copy
    dstCtx.putImageData(dstImageData, 0, 0);
}
