"use strict";
/*
 * 2018/04/23- (c) yoya@awm.jp
 */
importScripts("../lib/canvas.js");
importScripts("../lib/level.js");
importScripts("../lib/color.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var a = e.data.a;
    var b = e.data.b;
    var scaled = e.data.scaled;
    var linear = e.data.linear;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    if (scaled) {
	var sig0 = sigmoid(0.0, a, b);
	var sig1 = sigmoid(1.0, a, b);
    }
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [rr, gg, bb, aa] = getRGBA(srcImageData, x, y);
	    if (linear) {
		[rr, gg, bb] = sRGB2linearRGB([rr,gg,bb]);
	    } else {
		rr /= 255;  gg /= 255;  bb /= 255;
	    }
	    rr = sigmoid(rr, a, b);
	    gg = sigmoid(gg, a, b);
	    bb = sigmoid(bb, a, b);
	    // console.log([rr,gg,bb, aa])
	    if (scaled) {
		rr = (rr  - sig0) / (sig1 - sig0);
		gg = (gg  - sig0) / (sig1 - sig0);
		bb = (bb  - sig0) / (sig1 - sig0);
	    }
	    if (linear) {
		[rr, gg, bb] = linearRGB2sRGB([rr,gg,bb]);
	    } else {
		rr *= 255;  gg *= 255;  b *= 255;
	    }
	    
	    setRGBA(dstImageData, x, y, [rr, gg, bb, aa]);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
