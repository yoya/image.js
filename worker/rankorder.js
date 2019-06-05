"use strict";
/*
 * 2019/06/06- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, rankOrder, filterWindow] = [e.data.image,
                                                   e.data.rankOrder,
                                                   e.data.filterWindow];
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = rankOrderFilter(srcImageData, x, y,
                                       rankOrder, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function rankOrderFilter(srcImageData, srcX, srcY, rankOrder, filterWindow) {
    var startX = srcX - Math.floor((filterWindow-1)/2);
    var startY = srcY - Math.floor((filterWindow-1)/2);
    var endX = startX + filterWindow;
    var endY = startY + filterWindow;
    var windowArea = filterWindow * filterWindow;
    var rArr = new Uint8Array(windowArea);
    var gArr = new Uint8Array(windowArea);
    var bArr = new Uint8Array(windowArea);
    var aArr = new Uint8Array(windowArea);
    var i = 0;
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
	    rArr[i] = r;
	    gArr[i] = g;
	    bArr[i] = b;
	    aArr[i] = a;
	    i++;
	}
    }
    var compareFunc = function(a, b) {
	return a - b;
    }
    rArr.sort(compareFunc);
    gArr.sort(compareFunc);
    bArr.sort(compareFunc);
    aArr.sort(compareFunc);
    var rgba = [rArr[rankOrder-1], gArr[rankOrder-1],
	        bArr[rankOrder-1], aArr[rankOrder-1]];
    return rgba;
}



