"use strict";
/*
 * 2017/06/28- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, filterMatrix, filterWindow] = [e.data.image, e.data.filterMatrix, e.data.filterWindow];
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = smoothing(srcImageData, x, y,
				 filterMatrix, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function smoothing(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    r2 += r * filterMatrix[i];
	    g2 += g * filterMatrix[i];
	    b2 += b * filterMatrix[i];
	    i++;
	}
    }
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    return [r2, g2, b2, a];
}
