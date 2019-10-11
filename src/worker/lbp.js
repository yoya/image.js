'use strict';
/*
 * 2018/12/03- (c) yoya@awm.jp
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const threshold = e.data.threshold;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = LBP(srcImageData, x, y, threshold);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

const LBPorder = [0, 1, 2, 5, 8, 7, 6, 3]; // clock-wise order

function LBPbuild(arr, threshold) {
    let th;
    let v = 0;
    switch (threshold) {
    case 'center':
	th = arr[4];
	break;
    case 'mean':
	th = arr.reduce(function (a, b) { return a + b; }) / 9;
	break;
    case 'median':
	var arr2 = arr.concat(); // array clone
	arr2.sort();
	th = arr2[4];
	break;
    default:
	return;
    }
    for (let i = 0; i < 8; i++) {
	v <<= 1;
	v += (th < arr[LBPorder[i]]) ? 0 : 1;
    }
    return v;
}

function LBP(srcImageData, srcX, srcY, threshold) {
    const rArr = []; const gArr = []; const bArr = [];
    let [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    for (let y = -1; y <= 1; y++) {
	for (let x = -1; x <= 1; x++) {
	    [r, g, b] = getRGBA(srcImageData, srcX + x, srcY + y);
	    rArr.push(r);
	    gArr.push(g);
	    bArr.push(b);
	}
    }
    return [LBPbuild(rArr, threshold),
	    LBPbuild(gArr, threshold),
	    LBPbuild(bArr, threshold), a];
}
