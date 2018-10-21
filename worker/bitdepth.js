"use strict";
/*
 * 2018/10/16- (c) yoya@awm.jp
 * 2018/10/22- (c) yoya@awm.jp worker
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    var params = e.data;
    var srcImageData = e.data.image;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    drawBitDepth(srcImageData, dstImageData, params);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

var maxValueByBitDepth = {
    0: 1 - 1,
    1: 2 - 1,
    2: 2*2 - 1,
    3: 2*2*2 - 1 ,
    4: 2*2*2*2 - 1,
    5: 2*2*2*2*2 - 1,
    6: 2*2*2*2*2*2 - 1,
    7: 2*2*2*2*2*2*2 - 1,
    8: 2*2*2*2*2*2*2*2 - 1,
};

function quantizeDepth(v, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY) {
    var ditherSpread = 0;
    switch (dither) {
    case "none":
	ditherSpread = 0;
	break;
    case "random":
	ditherSpread = Math.random() - 0.5;
	break;
    default:
	console.error("wrong dither method:", dither);
    }
    var depthRatio = maxValueByBitDepth[dstBitDepth] / maxValueByBitDepth[srcBitDepth];
    var depthRatio2 = (maxValueByBitDepth[dstBitDepth]+1) / (maxValueByBitDepth[srcBitDepth]+1);
    if (srcBitDepth < dstBitDepth) {
	ditherSpread *= depthRatio;
	v = Math.round(v * depthRatio + ditherSpread);
    } else if (srcBitDepth > dstBitDepth) {
	switch (quantize) {
	case "nn":
	    v = Math.floor(v * depthRatio + ditherSpread + 0.5);
	    break;
	case "equalize":
	    v = Math.floor(v * depthRatio2 + ditherSpread);
	    break;
	case "inverse":
	    v = Math.floor(v * depthRatio + ditherSpread);
	    break;
	default:
	    console.error("wrong quantize method:", quantize);
	}
    }
    return v;
}

function bitDepth(rgba, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY) {
    return rgba.map(function(v) {
	v = quantizeDepth(v, 8, srcBitDepth, quantize, "none");
	v = quantizeDepth(v, srcBitDepth, dstBitDepth, quantize, dither, srcX, srcY);
	return quantizeDepth(v, dstBitDepth, 8, quantize, "none");
    });
}



function drawBitDepth(srcImageData, dstImageData, params) {
    // console.debug("drawBitDepth");
    var srcBitDepth = params.srcBitDepth;
    var dstBitDepth = params.dstBitDepth;
    var dither = params.dither;2
    var quantize = params.quantize;
    var width = srcImageData.width, height = srcImageData.height;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = getRGBA(srcImageData, x, y);
	    rgba = bitDepth(rgba, srcBitDepth, dstBitDepth,
			    quantize, dither, x, y);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
}

