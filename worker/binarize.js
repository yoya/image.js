"use strict";
/*
 * 2018/04/14- (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var params = e.data;
    var dstImageData = drawBinarize(srcImageData, params);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function drawBinarize(srcImageData, params) {
    var width = srcImageData.width, height = srcImageData.height;
    var threshold = params.threshold;
    var dstImageData = new ImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r,g,b,a] = getRGBA(srcImageData, x, y);
            r = (r <= threshold)?0:255;
            g = (g <= threshold)?0:255;
            b = (b <= threshold)?0:255;
	    setRGBA(dstImageData, x, y, [r,g,b,a]);
	}
    }
    return dstImageData;
}
