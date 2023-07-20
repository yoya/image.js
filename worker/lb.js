"use strict";
/*
 * 2018/12/12- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

function levelAdjustment(v, srcMinValue, srcMaxValue, dstMinValue, dstMaxValue) {
    if (v < srcMinValue) {
        return dstMinValue;
    } else if (srcMaxValue < v) {
        return dstMaxValue;
    }
    return dstMaxValue * (v - srcMinValue) / (srcMaxValue - srcMinValue) + dstMinValue;
}

onmessage = function(e) {
    const { image, params } = e.data;
    const { width, height } = image;
    const { thresholdMethod, maxLuminance, minLuminance } = params;
    const dstImageData = new ImageData(width, height);
    if ((maxLuminance === 255) && (minLuminance === 0)) {
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
	        const rgba = LB(image, x, y, thresholdMethod);
	        setRGBA(dstImageData, x, y, rgba);
	    }
        }
    } else {
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
	        let [r, g, b, a] = LB(image, x, y, thresholdMethod);
                r = levelAdjustment(r, minLuminance, maxLuminance, 0, 255);
                g = levelAdjustment(g, minLuminance, maxLuminance, 0, 255);
                b = levelAdjustment(b, minLuminance, maxLuminance, 0, 255);
	        setRGBA(dstImageData, x, y, [r, g, b, a]);
	    }
        }
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function LBbuild(arr, thresholdMethod) {
    let th;
    let v = 200;
    const c = arr[4];  // center pixel
    switch (thresholdMethod) {
    case "max-min":
	const max = Math.max.apply(null, arr);
	const min = Math.min.apply(null, arr);
	if (max === min) {
	    v = max;
	} else {
	    const c = arr[4];
	    v = 255 * (c - min) / (max-min)
	}
	break;
    case "mean":
	let m = arr.reduce(function (a, b) { return a + b; } ) / 9;
	if (m < 1) {
	    m = 1;
	}
	v = c * 255 / m;
	break;
    case "histogram":
	const arr2 = new Uint8ClampedArray(arr);
	arr2.sort();
        const th = arr2[4];  // medium value
	break;
    default:
	return ;
    }
    return v;
}

function LB(srcImageData, srcX, srcY, thresholdMethod) {
    const rArr = new Uint8ClampedArray(9);
    const gArr = new Uint8ClampedArray(9);
    const bArr = new Uint8ClampedArray(9);
    let [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    let i = 0;
    for (let y = -1 ; y <= 1 ; y++) {
	for (let x = -1 ; x <= 1 ; x++) {
	    [r, g, b] = getRGBA(srcImageData, srcX + x, srcY + y);
	    rArr[i] = r;
	    gArr[i] = g;
	    bArr[i] = b;
            i++;
	}
    }
    return new Uint8ClampedArray([
        LBbuild(rArr, thresholdMethod), LBbuild(gArr, thresholdMethod),
	LBbuild(bArr, thresholdMethod), a
    ]);
}
