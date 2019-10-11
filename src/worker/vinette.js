'use strict';
/*
 * 2017/06/13- (c) yoya@awm.jp
 * 2017/10/29- (c) yoya@awm.jp worker
 */

importScripts('../lib/color.js');
importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const radius = e.data.radius;
    const linearGamma = e.data.linearGamma;
    const inverse = e.data.inverse;
    // console.debug("drawVinette");
    const width = srcImageData.width; const height = srcImageData.height;
    //
    const dstImageData = new ImageData(width, height);
    let slant = Math.sqrt(width * width + height * height);
    slant *= radius;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = (x - (width  / 2)) / (slant / 2);
            const dy = (y - (height / 2)) / (slant / 2);
            var r = Math.sqrt(dx * dx + dy * dy);
	    let factor = Math.pow(Math.cos(r / 2), 4);
	    if (inverse) {
		factor = 1 / factor;
	    }
	    if (linearGamma) {
		const rgba = getRGBA(srcImageData, x, y);
		let [lr, lg, lb, la] = sRGB2linearRGB(rgba);
		lr *= factor;
		lg *= factor;
		lb *= factor;
		[r, g, b, a] = linearRGB2sRGB([lr, lg, lb, la]);
	    } else {
		var [r, g, b, a] = getRGBA(srcImageData, x, y);
		r *= factor;
		g *= factor;
		b *= factor;
	    }
	    setRGBA(dstImageData, x, y, [r, g, b, a]);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};
