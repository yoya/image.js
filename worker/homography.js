"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */
importScripts("../lib/canvas.js");
importScripts("../lib/math.js");

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
