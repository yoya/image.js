"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 * 2019/09/25- (c) yoya@awm.jp  WebWorker
 */

importScripts("../lib/canvas.js");
importScripts("../lib/color.js");

onmessage = function(e) {
    var imageData = e.data.image; // ignore this
    var diagramBaseImageData = e.data.diagramBaseImageData;
    var colorMatrix = e.data.colorMatrix;
    var linear = e.data.linear;
    var dstImageData = drawColorTransform(imageData, colorMatrix, linear);
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function colorTransform(imageData, x, y, mat, linear) {
    var [r, g, b, a] = getRGBA(imageData, x, y);
    if (linear) {
	[r, g, b] = sRGB2linearRGB([r, g, b]);
	r *= 255; g *= 255; b *= 255;
    }
    var r2 = r*mat[0] + g*mat[1] + b*mat[2]  + 255*mat[3];
    var g2 = r*mat[4] + g*mat[5] + b*mat[6]  + 255*mat[7];
    var b2 = r*mat[8] + g*mat[9] + b*mat[10] + 255*mat[11];
    if (linear) {
	r2 /= 255; g2 /= 255; b2 /= 255;
	[r2, g2, b2] = linearRGB2sRGB([r2, g2, b2]);
    }
    return [r2, g2, b2, a];
}

function drawColorTransform(srcImageData, colorMatrix, linear) {
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = colorTransform(srcImageData, x, y, colorMatrix, linear);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    return dstImageData;
}
