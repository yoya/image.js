"use strict";
/*
 * 2018/04/14- (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    const srcImageData = e.data.image;
    const params = e.data;
    const dstImageData = drawBinarize(srcImageData, params);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function randomValue(ratio) {
    let v = Math.random();       //  0.0 <= v < 1.0
    const r = Math.random() - 0.5; // -0.5 <= r < 0.5
    v = Math.sqrt(v);
    if (ratio < r) {
        v = 1 - v;
    }
    if (ratio < -0.5) {
	const ratio2 = (ratio+0.5)*2;
        v = v * (ratio2 + 1.0) ;
    } else if (0.5 < ratio) {
        const ratio2 = (ratio-0.5)*2;
        v = v * (1.0 - ratio2) + ratio2;
    }
    return v;
}

function drawBinarize(srcImageData, params) {
    const width = srcImageData.width, height = srcImageData.height;
    const threshold = params.threshold;
    const dither = params.dither;
    const dstImageData = new ImageData(width, height);
    switch (dither) {
    default:
    case "none":
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
	        let [r,g,b,a] = getRGBA(srcImageData, x, y);
                r = (r <= threshold)?0:255;
                g = (g <= threshold)?0:255;
                b = (b <= threshold)?0:255;
	        setRGBA(dstImageData, x, y, [r,g,b,a]);
	    }
        }
        break;
    case "random":
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
                const ratio = (threshold/255 - 0.5)*2; // 0...255 => -1.0...1.0
                const rnd = randomValue(ratio) * 255;
	        let [r,g,b,a] = getRGBA(srcImageData, x, y);
                r = (r <= rnd)?0:255;
                g = (g <= rnd)?0:255;
                b = (b <= rnd)?0:255;
	        setRGBA(dstImageData, x, y, [r,g,b,a]);
	    }
        }
        break;
    }
    return dstImageData;
}
