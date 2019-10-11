'use strict';
/*
 * 2018/04/23- (c) yoya@awm.jp
 */
importScripts('../lib/canvas.js');
importScripts('../lib/level.js');
importScripts('../lib/color.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const a = e.data.a;
    const b = e.data.b;
    const linear = e.data.linear;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    //
    const sig0 = sigmoid(0.0, a, b);
    const sig1 = sigmoid(1.0, a, b);
    if (a < 0.001) {
	postMessage({ image:srcImageData }, [srcImageData.data.buffer]);
	return;
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    let [rr, gg, bb, aa] = getRGBA(srcImageData, x, y);
	    if (linear) {
		[rr, gg, bb] = sRGB2linearRGB([rr, gg, bb]);
	    } else {
		rr /= 255;  gg /= 255;  bb /= 255;
	    }
	    rr = (sigmoid(rr, a, b) - sig0) / (sig1 - sig0);
	    gg = (sigmoid(gg, a, b) - sig0) / (sig1 - sig0);
	    bb = (sigmoid(bb, a, b) - sig0) / (sig1 - sig0);
	    if (linear) {
		[rr, gg, bb] = linearRGB2sRGB([rr, gg, bb]);
	    } else {
		rr *= 255;  gg *= 255;  bb *= 255;
	    }
	    setRGBA(dstImageData, x, y, [rr, gg, bb, aa]);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};
