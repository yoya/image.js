"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp webworker
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, filterMatrix, filterWindow] = [e.data.image, e.data.filterMatrix, e.data.filterWindow];
    var dstImageData = drawConvolution(srcImageData, filterMatrix, filterWindow);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function convolution(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    r2 += r * filterMatrix[i];
	    g2 += g * filterMatrix[i];
	    b2 += b * filterMatrix[i];
	    i++;
	}
    }
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    return [r2, g2, b2, a];
}

function drawConvolution(srcImageData, filterMatrix, filterWindow) {
    // console.debug("drawConvolution");
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    var dstImageData = new ImageData(dstWidth, dstHeight);
    //
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = convolution(srcImageData, srcX, srcY, filterMatrix, filterWindow);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    return dstImageData;
}

