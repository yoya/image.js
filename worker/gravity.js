"use strict";
/*
 * 2017/06/23- (c) yoya@awm.jp
 * 2017/07/14- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    console.debug("worker/onmessage:", e);
    var srcImageData = e.data.image;
    var dstWidth  = e.data.dstWidth;
    var dstHeight = e.data.dstHeight;
    var gravity = e.data.gravity;
    var outfill = e.data.outfill;
    var dstImageData = new ImageData(dstWidth, dstHeight);
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    //
        var offsetX = gravityLayout(srcWidth, dstWidth, (gravity-1)%3);
    var offsetY = gravityLayout(srcHeight, dstHeight, Math.floor((gravity-1)/3));
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX - offsetX;
	    var srcY = dstY - offsetY;
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function gravityLayout(srcSize, dstSize, gravity) {
    // console.debug("gravityLayout:",srcSize, dstSize, gravity);
    if (gravity == 0) { // left or top
	return 0;
    } else if (gravity === 1) { // center
	return Math.floor((dstSize - srcSize) / 2);
    } else { // right or buttom
	return dstSize - srcSize;
    }
}
