'use strict';
/*
 * 2018/04/14- (c) yoya@awm.jp
 */

importScripts('../lib/color.js');
importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const threshold = e.data.threshold;
    const grayscale = e.data.grayscale;
    const linearGamma = e.data.linearGamma;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    let rgba = getRGBA(srcImageData, x, y);
	    if (grayscale) {
		let [r, g, b, a] = rgba;
		const v =  0.299 * r + 0.587 * g + 0.114 * b; // BT.601
		r = g = b = v;
		rgba = [r, g, b, a];
	    }
	    if (linearGamma) {
		rgba = sRGB2linearRGB(rgba);
		rgba = rgba.map(function(v) { return (v <= threshold / 255) ? 0 : 1; });
		rgba = linearRGB2sRGB(rgba);
	    } else {
		rgba = rgba.map(function(v) { return (v <= threshold) ? 0 : 255; });
	    }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};
