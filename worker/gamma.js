"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 * 2017/10/31- (c) yoya@awm.jp WebWorker
 */
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var RGamma = e.data.RGamma;
    var GGamma = e.data.GGamma;
    var BGamma = e.data.BGamma;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    r = Math.pow(r/255, RGamma) * 255;
	    g = Math.pow(g/255, GGamma) * 255;
	    b = Math.pow(b/255, BGamma) * 255;
	    // a = Math.pow(a/255, gamma) * 255;
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
