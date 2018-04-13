"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 * 2017/10/30- (c) yoya@awm.jp WebWorker
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var equation = e.data.equation;
    var grayscale = e.data.grayscale;
    var linearGamma = e.data.linearGamma;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    var define = "var max=Math.max, min=Math.min ; ";
    var func = new Function("R","G","B", define+"return " + equation);
    var grayscale_rev = 1 - grayscale;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = getRGBA(srcImageData, x, y);
	    if (grayscale === 0) {
		; // do nothing
	    } else {
		if (linearGamma) {
		    rgba = sRGB2linearRGB(rgba);
		}
		var [r, g, b, a] = rgba;
		var v = func(r, g, b);
		if (grayscale === 1) {
		    rgba = [v, v, v, a];
		} else {
		    rgba = [grayscale_rev * r + grayscale * v,
			    grayscale_rev * g + grayscale * v,
			    grayscale_rev * b + grayscale * v,
			    a];
		}
		if (linearGamma) {
		    rgba = linearRGB2sRGB(rgba);
		}
	    }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
