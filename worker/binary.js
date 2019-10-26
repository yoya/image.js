"use strict";
/*
 * 2018/04/14- (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var threshold = e.data.threshold;
    var linearGamma = e.data.linearGamma;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = getRGBA(srcImageData, x, y);
	    if (linearGamma) {
		rgba = sRGB2linearRGB(rgba);
		rgba = rgba.map(function(v) { return (v <= threshold/255)?0:1; } );
		rgba = linearRGB2sRGB(rgba);
	    } else {
		rgba = rgba.map(function(v) { return (v <= threshold)?0:255; } );
	    }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
