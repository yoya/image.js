'use strict';
/*
 * 2017/06/23- (c) yoya@awm.jp
 * 2017/07/14- (c) yoya@awm.jp  WebWorker
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    console.debug('worker/onmessage:', e);
    const srcImageData = e.data.image;
    const dstWidth  = e.data.dstWidth;
    const dstHeight = e.data.dstHeight;
    const gravity = e.data.gravity;
    const outfill = e.data.outfill;
    const dstImageData = new ImageData(dstWidth, dstHeight);
    const srcWidth = srcImageData.width; const srcHeight = srcImageData.height;
    //
        const offsetX = gravityLayout(srcWidth, dstWidth, (gravity - 1) % 3);
    const offsetY = gravityLayout(srcHeight, dstHeight, Math.floor((gravity - 1) / 3));
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX - offsetX;
	    const srcY = dstY - offsetY;
	    const rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function gravityLayout(srcSize, dstSize, gravity) {
    // console.debug("gravityLayout:",srcSize, dstSize, gravity);
    if (gravity == 0) { // left or top
	return 0;
    } else if (gravity === 1) { // center
	return Math.floor((dstSize - srcSize) / 2);
    }  // right or buttom
	return dstSize - srcSize;
}
