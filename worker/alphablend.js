"use strict";
/*
 * 2017/04/27- (c) yoya@awm.jp
 * 2018/01/01- worker (c) yoya@awm.jp
 */

importScripts("../lib/color.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    const [srcImageData1, srcImageData2] = e.data.image;
    const { method, ratio1, ratio2, linearGamma, shiftX, shiftY } = e.data;
    const srcWidth1 = srcImageData1.width, srcHeight1 = srcImageData1.height;
    const srcWidth2 = srcImageData2.width, srcHeight2 = srcImageData2.height;
    const dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    const dstHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;

    const dstImageData = new ImageData(dstWidth, dstHeight);

    const startX1 = (shiftX < 0)? -shiftX: 0;
    const startX2 = (shiftX < 0)? 0: shiftX;
    const startY1 = (shiftY < 0)? -shiftY: 0;
    const startY2 = (shiftY < 0)? 0: shiftY;

    for (let dstY = 0 ; dstY < dstHeight; dstY++) {
        for (let dstX = 0 ; dstX < dstWidth; dstX++) {
	    const srcX1 = dstX + startX1, srcY1 = dstY + startY1;
	    const srcX2 = dstX + startX2, srcY2 = dstY + startY2;
	    let rgba1 = getRGBA(srcImageData1, srcX1, srcY1);
	    let rgba2 = getRGBA(srcImageData2, srcX2, srcY2);
	    let r1,g1,b1,a1, r2,g2,b2,a2;
	    if (linearGamma) {
		rgba1 = sRGB2linearRGB(rgba1);
		rgba2 = sRGB2linearRGB(rgba2);
		[r1,g1,b1,a1] = rgba1;
		[r2,g2,b2,a2] = rgba2;
	    } else {
		[r1,g1,b1,a1] = rgba1; // uint to double
		[r2,g2,b2,a2] = rgba2; // uint to double
		[r1, g1, b1, a1] = [r1, g1, b1, a1].map(function(v) { return v/255; });
		[r2, g2, b2, a2] = [r2, g2, b2, a2].map(function(v) { return v/255; });
	    }
	    let rgba;
	    switch (method) {
	    case "plus":
		rgba = [r1*ratio1 + r2*ratio2,
			g1*ratio1 + g2*ratio2,
			b1*ratio1 + b2*ratio2,
			a1*ratio1 + a2*ratio2];
		break;
	    case "minus":
		rgba = [r1*ratio1 - r2*ratio2,
			g1*ratio1 - g2*ratio2,
			b1*ratio1 - b2*ratio2,
                        a1*ratio1 - a2*ratio2];
		break;
	    case "multi":
		rgba = [r1*ratio1 * r2*ratio2,
			g1*ratio1 * g2*ratio2,
			b1*ratio1 * b2*ratio2,
                        a1*ratio1 * a2*ratio2];
		break;
	    case "div":
		rgba = [r1*ratio1 / r2*ratio2,
			g1*ratio1 / g2*ratio2,
			b1*ratio1 / b2*ratio2,
                        a1*ratio1 / a2*ratio2];
		break;
	    default:
		console.error("unknown method:"+method);
		break;
	    }
	    if (linearGamma) {
		rgba = linearRGB2sRGB(rgba);
	    } else {
		rgba = rgba.map(function(v) { return v*255; });
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
