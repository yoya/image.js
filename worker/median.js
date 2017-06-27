"use strict";
/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2017/06/26- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, filter, filterWindow] = [e.data.image, e.data.filter,
						e.data.filterWindow];
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = medianFilter(srcImageData, x, y, filter, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function medianFilter(srcImageData, srcX, srcY, filter, filterWindow) {
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
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
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
    var rgba = [255, 0, 0, 255];
    switch (filter) {
	case "max":
	rgba = [rArr[windowArea-1], gArr[windowArea-1],
		bArr[windowArea-1], aArr[windowArea-1]];
	break;
	case "median":
	var windowArea_2 = Math.floor((windowArea-1) / 2);
	rgba = [rArr[windowArea_2], gArr[windowArea_2],
		bArr[windowArea_2], aArr[windowArea_2]];
		break;
	case "min":
	rgba =  [rArr[0], gArr[0], bArr[0], aArr[0]];
	break;
    default:
	console.error("Illegal filter:"+filter);
    }
    return rgba;
}



