'use strict';
/*
 * 2017/04/07- (c) yoya@awm.jp
 * 2019/09/25- (c) yoya@awm.jp  WebWorker
 */

importScripts('../lib/canvas.js');
importScripts('../lib/color.js');

onmessage = function(e) {
    const imageData = e.data.image; // ignore this
    const diagramBaseImageData = e.data.diagramBaseImageData;
    const colorMatrix = e.data.colorMatrix;
    const linear = e.data.linear;
    const dstImageData = drawColorTransform(imageData, colorMatrix, linear);
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function colorTransform(imageData, x, y, mat, linear) {
    let [r, g, b, a] = getRGBA(imageData, x, y);
    if (linear) {
	[r, g, b] = sRGB2linearRGB([r, g, b]);
	r *= 255; g *= 255; b *= 255;
    }
    let r2 = r * mat[0] + g * mat[1] + b * mat[2]  + 255 * mat[3];
    let g2 = r * mat[4] + g * mat[5] + b * mat[6]  + 255 * mat[7];
    let b2 = r * mat[8] + g * mat[9] + b * mat[10] + 255 * mat[11];
    if (linear) {
	r2 /= 255; g2 /= 255; b2 /= 255;
	[r2, g2, b2] = linearRGB2sRGB([r2, g2, b2]);
    }
    return [r2, g2, b2, a];
}

function drawColorTransform(srcImageData, colorMatrix, linear) {
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    //
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    const rgba = colorTransform(srcImageData, x, y, colorMatrix, linear);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    return dstImageData;
}
