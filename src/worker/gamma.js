'use strict';
/*
 * 2017/04/02- (c) yoya@awm.jp
 * 2017/10/31- (c) yoya@awm.jp WebWorker
 */
importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const RGamma = e.data.RGamma;
    const GGamma = e.data.GGamma;
    const BGamma = e.data.BGamma;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    //
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    let [r, g, b, a] = getRGBA(srcImageData, x, y);
	    r = Math.pow(r / 255, RGamma) * 255;
	    g = Math.pow(g / 255, GGamma) * 255;
	    b = Math.pow(b / 255, BGamma) * 255;
	    // a = Math.pow(a/255, gamma) * 255;
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};
