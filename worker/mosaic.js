"use strict";
/*
 * 2017/06/22- (c) yoya@awm.jp
 * 2017/09/04- (c) yoya@awm.jp worker
 */

importScripts("../lib/matrix.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    var srcImageData = e.data.image;
    var blockSize = e.data.blockSize;
    var blockType = e.data.blockType;
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstWidth = srcWidth;
    dstHeight = srcHeight;
    //
    var dstImageData = new ImageData(dstWidth, dstHeight);
    console.log("blockType:"+blockType);
    if (blockType === "square") {
	console.debug("square");
	for (var dstY = 0 ; dstY < dstHeight; dstY+=blockSize) {
            for (var dstX = 0 ; dstX < dstWidth; dstX+=blockSize) {
		var [r2, g2, b2, a2] = [0, 0, 0, 0];
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			var srcX = dstX + x
			var srcY = dstY + y;
			var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY, OUTFILL_MIRROR);
			r2 += r;  g2 += g;  b2 += b; a2 += a;
		    }
		}
		var bs2 = blockSize*blockSize;
		r2 /= bs2; g2 /= bs2; b2 /= bs2; a2 /= bs2;
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
	    }
	}
    } else { // hexagon
	console.debug("hexagon");
	var blockSizeH = Math.round(blockSize * Math.sqrt(1 - 0.25));
	var blockSize_2 = Math.round(blockSize / 2);
	var odd = true;
	for (var dstY = -blockSizeH ; dstY < dstHeight + blockSizeH; dstY+=blockSizeH) {
            for (var dstX = (odd)?0:-blockSize_2 ; dstX < dstWidth + blockSize_2; dstX+=blockSize) {
		var [r2, g2, b2, a2] = [0, 0, 0, 0];
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			var srcX = dstX + x
			var srcY = dstY + y;
			var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY, OUTFILL_MIRROR);
			r2 += r;  g2 += g;  b2 += b; a2 += a;
		    }
		}
		var bs2 = blockSize*blockSize;
		r2 /= bs2; g2 /= bs2; b2 /= bs2; a2 /= bs2;
		for (var y = Math.round(-blockSize/3) ; y < 0 ; y++) {
		    for (var x = -2*y  ; x < blockSize + 2*y ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
		for (var y = 0 ; y < Math.round(blockSize*2/3) ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
		for (var y = Math.round(blockSize*2/3); y < blockSize ; y++) {
		    for (var x = Math.round((y-blockSize*2/3)*2) ; x < blockSize - Math.round((y-blockSize*2/3)*2) ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
	    }
	    odd = !odd;
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}
