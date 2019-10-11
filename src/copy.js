'use strict';
/*
 * 2017/04/02- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 });
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas);
}

function drawCopy(srcCanvas, dstCanvas) {
    // console.debug("drawCopy");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth  = srcWidth;
    const dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX;
	    const srcY = dstY;
	    const rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
