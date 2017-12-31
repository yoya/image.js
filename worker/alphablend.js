"use strict";
/*
 * 2017/04/27- (c) yoya@awm.jp
 * 2018/01/01- worker (c) yoya@awm.jp
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData1, srcImageData2] = e.data.image;
    var method = e.data.method;
    var ratio1 = e.data.ratio1
    var ratio2 = e.data.ratio2
    var linearGamma = e.data.linearGamma;
    var srcWidth1 = srcImageData1.width, srcHeight1 = srcImageData1.height;
    var srcWidth2 = srcImageData2.width, srcHeight2 = srcImageData2.height;
    var dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    var dstHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;

    var dstImageData = new ImageData(dstWidth, dstHeight);

    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX1 = dstX, srcY1 = dstY;
	    var srcX2 = dstX, srcY2 = dstY;
	    var rgba1 = getRGBA(srcImageData1, srcX1, srcY1);
	    var rgba2 = getRGBA(srcImageData2, srcX2, srcY2);
	    if (linearGamma) {
		rgba1 = sRGB2linearRGB(rgba1);
		rgba2 = sRGB2linearRGB(rgba2);
		var [r1,g1,b1,a1] = rgba1;
		var [r2,g2,b2,a2] = rgba2;
	    } else {
		var [r1,g1,b1,a1] = rgba1; // uint to double
		var [r2,g2,b2,a2] = rgba2; // uint to double
		[r1, g1, b1, a1] = [r1, g1, b1, a1].map(function(v) { return v/255; });
		[r2, g2, b2, a2] = [r2, g2, b2, a2].map(function(v) { return v/255; });
	    }
	    var rgba;
	    switch (method) {
	    case "plus":
		rgba = [r1*ratio1 + r2*ratio2,
			g1*ratio1 + g2*ratio2,
			b1*ratio1 + b2*ratio2,
			(a1+a2)/2];
		break;
	    case "minus":
		rgba = [r1*ratio1 - r2*ratio2,
			g1*ratio1 - g2*ratio2,
			b1*ratio1 - b2*ratio2,
			(a1+a2)/2];
		break;
	    case "multi":
		rgba = [r1*ratio1 * r2*ratio2,
			g1*ratio1 * g2*ratio2,
			b1*ratio1 * b2*ratio2,
			(a1 + a2)/2];
		break;
	    case "div":
		rgba = [r1*ratio1 / r2*ratio2,
			g1*ratio1 / g2*ratio2,
			b1*ratio1 / b2*ratio2,
			(a1 + a2)/2];
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
