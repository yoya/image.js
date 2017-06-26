"use strict";
/*
 * 2017/06/26- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, filter,
	 structureTable, filterWindow] = [e.data.image, e.data.filter,
					  e.data.structureTable,
					  e.data.filterWindow];
    var srcWidth = srcImageData.width;
    var srcHeight = srcImageData.height;
    var dstImageData = new ImageData(srcWidth, srcHeight);
    drawMorphologyFilter_worker(srcImageData, dstImageData,
				filter, structureTable, filterWindow);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function drawMorphologyFilter_worker(srcImageData, dstImageData,
				     filter, structureTable, filterWindow) {
    // console.debug("drawMorphologyFilter_worker:", filter, structureTable, filterWindow);
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstWidth  = dstImageData.width, dstHeight = dstImageData.height;
    //
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = morphologyFilter(srcImageData, srcX, srcY,
					filter, structureTable, filterWindow);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

function morphologyFilter(srcImageData, srcX, srcY,
			  filter, structureTable, filterWindow) {
    var startX = srcX - Math.floor((filterWindow-1)/2);
    var startY = srcY - Math.floor((filterWindow-1)/2);
    var endX = startX + filterWindow;
    var endY = startY + filterWindow;
    var windowArea = structureTable.reduce(function(prev, cur) {
	return prev + (cur?1:0);
    });
    var rArr = new Uint8Array(windowArea);
    var gArr = new Uint8Array(windowArea);
    var bArr = new Uint8Array(windowArea);
    var aArr = new Uint8Array(windowArea);
    var i = 0, j = 0;;
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    if (structureTable[i]) {
		rArr[j] = r;
		gArr[j] = g;
		bArr[j] = b;
		aArr[j] = a;
		j++;
	    }
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



