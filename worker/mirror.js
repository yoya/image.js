"use strict";
/*
 * 2021/04/18- (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");
importScripts("../lib/color.js");  // linearRGB

onmessage = function(e) {
    const [srcImageData, params] = [e.data.image, e.data];
    const [border, blurKernelSize, blurKernel, amp, linearRGB] = [params.border, params.blurKernelSize, params.blurKernel, params.amp, params.linearRGB];
    console.log(params);
    const width = srcImageData.width, height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    const y_border = Math.round(height * border / 100);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    let rgba;
            if (y < y_border) {
	        rgba = getRGBAmirror(srcImageData, x, y, y_border);
            } else {
                rgba = convolution(srcImageData, x, y, blurKernel, blurKernelSize, y_border, linearRGB);
                rgba[0] *= amp/100;
                rgba[1] *= amp/100;
                rgba[2] *= amp/100;
            }
            setRGBA(dstImageData, x, y, rgba);
	}
    }
     postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function getRGBAmirror(imageData, x, y, y_border) {
    if (y >= y_border) {
        y = y_border - (y - y_border);
    }
    return getRGBA(imageData, x, y);
}

function convolution(imageData, srcX, srcY, kernelMatrix, kernelSize,
                     y_border, linearRGB) {
    var startX = srcX - Math.floor((kernelSize)/2),
        endX = startX + kernelSize;
    var startY = srcY - Math.floor((kernelSize)/2),
        endY = startY + kernelSize;
    var i = 0;
    var [r, g, b, a] = getRGBA(imageData, srcX, srcY);  // original alpha
    var [r2, g2, b2, a2] = [0, 0, 0, a];
    for (var y = startY ; y < endY ; y++) {
        for (var x = startX ; x < endX ; x++) {
            var sRGB = getRGBAmirror(imageData, x, y, y_border);
            if (linearRGB) {
                [r, g, b] = sRGB2linearRGB(sRGB);
            } else {
                [r, g, b] = sRGB;
            }
            r2 += r * kernelMatrix[i];
            g2 += g * kernelMatrix[i];
            b2 += b * kernelMatrix[i];
            i++;
        }
    }
    if (linearRGB) {
        [r2, g2, b2] = linearRGB2sRGB([r2, g2, b2]);
    }
    return [r2, g2, b2, a2];
}
