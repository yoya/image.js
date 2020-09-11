"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */
importScripts("../lib/canvas.js");
importScripts("../lib/canvas_interpolation.js");
importScripts("../lib/math.js");

onmessage = function(e) {
    // console.debug("drawHomography onmessage", e.data);
    var srcImageData = e.data.image;
    var coeff = e.data.coeff;
    var interpolation = e.data.interpolation;
    var width = srcImageData.width, height = srcImageData.height;
    var dstImageData = new ImageData(width, height);
    //
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            var dstX = x / width, dstY = y / height;
            let [srcX, srcY] = homography(dstX, dstY, coeff);
            srcX *= width;  srcY *= height;
            let rgba;
            if (interpolation === "NN") {
	        rgba = getRGBA_NN(srcImageData, srcX, srcY);
            } else {
	        rgba = getRGBA_BL(srcImageData, srcX, srcY);
            }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
