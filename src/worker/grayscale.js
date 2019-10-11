'use strict';
/*
 * 2017/04/17- (c) yoya@awm.jp
 * 2017/10/30- (c) yoya@awm.jp WebWorker
 */

importScripts('../lib/color.js');
importScripts('../lib/canvas.js');

onmessage = function(e) {
    const srcImageData = e.data.image;
    const equation = e.data.equation;
    const colorFactor = e.data.colorFactor;
    let linearGamma = e.data.linearGamma;
    const width = srcImageData.width; const height = srcImageData.height;
    const dstImageData = new ImageData(width, height);
    const define = 'var max=Math.max, min=Math.min ; ';
    const func = new Function('R', 'G', 'B', define + 'return ' + equation);

    if (equation.indexOf('(linear)') >= 0) {
	linearGamma = true; // for CIE XYZ
    }

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
	    let rgba = getRGBA(srcImageData, x, y);
	    if (colorFactor === 1.0) {
		 // do nothing
	    } else {
		if (linearGamma) {
		    rgba = sRGB2linearRGB(rgba);
		}
		const [r, g, b, a] = rgba;
		const v = func(r, g, b);
		if (colorFactor === 0) {
		    rgba = [v, v, v, a];
		} else {
		    rgba = [r * colorFactor + v * (1 - colorFactor),
			    g * colorFactor + v * (1 - colorFactor),
			    b * colorFactor + v * (1 - colorFactor),
			    a];
		}
		if (linearGamma) {
		    rgba = linearRGB2sRGB(rgba);
		}
	    }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};
