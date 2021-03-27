"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp webworker
 */

importScripts("../lib/canvas.js");
importScripts("../lib/statistics.js");

onmessage = function(e) {
    var [srcImageData, params] = [e.data.image, e.data];
    var [filterMatrix, filterWindow, imageNormalize] = [params.filterMatrix, params.filterWindow, params.imageNormalize];
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = convolution(srcImageData, x, y,
				   filterMatrix, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    if (imageNormalize) {
        Statistics.mogrifyNormalize(dstImageData.data, 255);
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function convolution(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);  // original alpha
    var [r2, g2, b2, a2] = [0, 0, 0, a];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    [r, g, b] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    r2 += r * filterMatrix[i];
	    g2 += g * filterMatrix[i];
	    b2 += b * filterMatrix[i];
	    i++;
	}
    }
    return [r2, g2, b2, a2];
}
