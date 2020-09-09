"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */
importScripts("../lib/canvas.js");

onmessage = function(e) {
    console.debug("drawHomography onmessage");
    var srcImageData = e.data.image;
    var coeff = e.data.coeff;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    console.debug("coeff:", coeff);
    //
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            var dstX = x / width, dstY = y / height;
            let [srcX, srcY] = homography(dstX, dstY, coeff);
	    let rgba = getRGBA(srcImageData,
                               Math.round(srcX * width),
                               Math.round(srcY * height));
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function homography(x, y, coeff) {
    let [a, b, c, d, e, f, g, h] = coeff;
    let xx = (a*x + b*y + c) / (g*x + h*y + 1);
    let yy = (d*x + e*y + f) / (g*x + h*y + 1);
    return [xx, yy];
}
