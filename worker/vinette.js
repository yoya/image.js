"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
 * 2017/10/29- (c) yoya@awm.jp worker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var radius = e.data.radius;
    var linearGamma = e.data.linearGamma;
    var inverse = e.data.inverse;
    // console.debug("drawVinette");
    var width = srcImageData.width, height = srcImageData.height;
    //
    var dstImageData = new ImageData(width, height);
    var slant = Math.sqrt(width*width + height*height);
    slant *= radius;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
            var dx = (x - (width  / 2)) / (slant/2);
            var dy = (y - (height / 2)) / (slant/2);
            var r = Math.sqrt(dx*dx + dy*dy);
	    var factor = Math.pow(Math.cos(r/2), 4);
	    if (inverse) {
		factor = 1 / factor;
	    }
	    if (linearGamma) {
		var rgba = getRGBA(srcImageData, x, y);
		var [lr, lg, lb, la] = sRGB2linearRGB(rgba);
		lr *= factor;
		lg *= factor;
		lb *= factor;
		[r, g, b, a] = linearRGB2sRGB([lr, lg, lb, la]);
	    } else {
		var [r, g, b, a] = getRGBA(srcImageData, x, y);
		r *= factor;
		g *= factor;
		b *= factor;
	    }
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
