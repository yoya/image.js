'use strict';
/*
 * 2017/04/07- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp webworker
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const [srcImageData, filterMatrix, filterWindow] = [e.data.image, e.data.filterMatrix, e.data.filterWindow];
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    //
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = convolution(srcImageData, x, y,
				   filterMatrix, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function convolution(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    const startX = srcX - (convWindow - 1) / 2; const endX = startX + convWindow;
    const startY = srcY - (convWindow - 1) / 2; const endY = startY + convWindow;
    let i = 0;
    let [r2, g2, b2, a2] = [0, 0, 0, 0];
    for (let y = startY; y < endY; y++) {
	for (let x = startX; x < endX; x++) {
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
