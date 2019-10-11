'use strict';
/*
 * 2017/02/26- (c) yoya@awm.jp
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
	    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawDotize(srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'scaleRange':'scaleText',
		  'borderRange':'borderText'
},
		 function() { drawDotize(srcCanvas, dstCanvas); });
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawDotize(srcCanvas, dstCanvas);
		 });
}

function drawDotize(srcCanvas, dstCanvas) {
    // console.debug("drawDotize");
    const scale = parseFloat(document.getElementById('scaleRange').value);
    const border = parseFloat(document.getElementById('borderRange').value);
    //
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth  = srcWidth  * scale + (srcWidth  + 1) * border;
    const dstHeight = srcHeight * scale + (srcHeight + 1) * border;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    const srcData = srcImageData.data;
    const dstData = dstImageData.data;
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = Math.floor(dstX / (scale + border));
	    const srcY = Math.floor(dstY / (scale + border));
	    let srcOffset = 4 * (srcX + srcY * srcWidth);
	    let dstOffset = 4 * (dstX + dstY * dstWidth);
	    if (((dstX % (scale + border)) < border) ||
		((dstY % (scale + border)) < border)) {
		dstData[dstOffset++] = 0;
		dstData[dstOffset++] = 0;
		dstData[dstOffset++] = 0;
		dstData[dstOffset++] = 255;
	    } else {
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
