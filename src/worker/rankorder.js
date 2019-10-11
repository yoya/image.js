'use strict';
/*
 * 2019/06/06- (c) yoya@awm.jp
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const [srcImageData, rankOrder, filterWindow] = [e.data.image,
                                                   e.data.rankOrder,
                                                   e.data.filterWindow];
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = rankOrderFilter(srcImageData, x, y,
                                       rankOrder, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function rankOrderFilter(srcImageData, srcX, srcY, rankOrder, filterWindow) {
    const startX = srcX - Math.floor((filterWindow - 1) / 2);
    const startY = srcY - Math.floor((filterWindow - 1) / 2);
    const endX = startX + filterWindow;
    const endY = startY + filterWindow;
    const windowArea = filterWindow * filterWindow;
    const rArr = new Uint8Array(windowArea);
    const gArr = new Uint8Array(windowArea);
    const bArr = new Uint8Array(windowArea);
    const aArr = new Uint8Array(windowArea);
    let i = 0;
    for (let y = startY; y < endY; y++) {
	for (let x = startX; x < endX; x++) {
	    const [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    rArr[i] = r;
	    gArr[i] = g;
	    bArr[i] = b;
	    aArr[i] = a;
	    i++;
	}
    }
    const compareFunc = function(a, b) {
	return a - b;
    };
    rArr.sort(compareFunc);
    gArr.sort(compareFunc);
    bArr.sort(compareFunc);
    aArr.sort(compareFunc);
    const rgba = [rArr[rankOrder - 1], gArr[rankOrder - 1],
	        bArr[rankOrder - 1], aArr[rankOrder - 1]];
    return rgba;
}
