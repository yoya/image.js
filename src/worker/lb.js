'use strict';
/*
 * 2018/12/12- (c) yoya@awm.jp
 */

importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const threshold = e.data.threshold;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = LB(srcImageData, x, y, threshold);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function LBbuild(arr, threshold) {
    let th;
    let v = 200;
    switch (threshold) {
    case 'max-min':
	var max = Math.max.apply(null, arr);
	var min = Math.min.apply(null, arr);
	// console.log(arr);
	if (max === min) {
	    v = max;
	} else {
	    var c = arr[4];
	    v = 255 * (c - min) / (max - min);
	}
	break;
    case 'mean':
	var m = arr.reduce(function (a, b) { return a + b; }) / 9;
	if (m < 1) {
	    m = 1;
	}
	var c = arr[4];
	v = c * 255 / m;
	break;
    case 'histogram':
	var arr2 = arr.concat(); // array clone
	arr2.sort();
	th = arr2[4];
	break;
    default:
	return;
    }
    return v;
}

function LB(srcImageData, srcX, srcY, threshold) {
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
    return [LBbuild(rArr, threshold),
	    LBbuild(gArr, threshold),
	    LBbuild(bArr, threshold), a];
}
