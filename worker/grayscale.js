"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 * 2017/10/30- (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var equation = e.data.equation;
    var grayscale = e.data.grayscale;

    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    var define = "var max=Math.max, min=Math.min ; " +
	"var CIEXYZ = rgb => linearRGB2sRGB(sRGB2XYZ(rgb)) ; " ;
    var func = new Function("R","G","B", define+"return " + equation);
    var grayscale_rev = 1 - grayscale;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    var rgba;
	    if (grayscale === 0) {
		rgba =  [r, g, b, a];
	    } else {
		var v = func(r, g, b);
		if (grayscale === 1) {
		    rgba = [v, v, v, a];
		} else {
		    rgba = [grayscale_rev * r + grayscale * v,
			    grayscale_rev * g + grayscale * v,
			    grayscale_rev * b + grayscale * v,
			    a];
		}
	    }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
