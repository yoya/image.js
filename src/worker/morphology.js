'use strict';
/*
 * 2017/06/26- (c) yoya@awm.jp
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const [srcImageData, filter,
	 structureTable, filterWindow] = [e.data.image, e.data.filter,
					  e.data.structureTable,
					  e.data.filterWindow];
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = morphologyFilter(srcImageData, x, y,
					filter, structureTable, filterWindow);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function morphologyFilter(srcImageData, srcX, srcY,
			  filter, structureTable, filterWindow) {
    const startX = srcX - Math.floor((filterWindow - 1) / 2);
    const startY = srcY - Math.floor((filterWindow - 1) / 2);
    const endX = startX + filterWindow;
    const endY = startY + filterWindow;
    const windowArea = structureTable.reduce(function(prev, cur) {
	return prev + (cur ? 1 : 0);
    });
    const rArr = new Uint8Array(windowArea);
    const gArr = new Uint8Array(windowArea);
    const bArr = new Uint8Array(windowArea);
    const aArr = new Uint8Array(windowArea);
    let i = 0; let j = 0;
    for (let y = startY; y < endY; y++) {
	for (let x = startX; x < endX; x++) {
	    if (structureTable[i]) {
		const [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
		rArr[j] = r;
		gArr[j] = g;
		bArr[j] = b;
		aArr[j] = a;
		j++;
	    }
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
    let rgba;
    switch (filter) {
	case 'max':
	rgba = [rArr[windowArea - 1], gArr[windowArea - 1],
		bArr[windowArea - 1], aArr[windowArea - 1]];
	break;
	case 'median':
	var windowArea_2 = Math.floor((windowArea - 1) / 2);
	rgba = [rArr[windowArea_2], gArr[windowArea_2],
		bArr[windowArea_2], aArr[windowArea_2]];
		break;
	case 'min':
	rgba =  [rArr[0], gArr[0], bArr[0], aArr[0]];
	break;
    default:
	rgba = [255, 0, 0, 255];
	console.error('Illegal filter:' + filter);
    }
    return rgba;
}
