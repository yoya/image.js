"use strict";
/*
 * 2017/04/21- (c) yoya@awm.jp
 * 2017/07/02- (c) yoya@awm.jp WebWorker
 */

importScripts("../lib/matrix.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    var srcImageData = e.data.image;
    var affinMatrix = e.data.affinMatrix;
    var affinMatrix = e.data.affinMatrix;
    var rotateRoundCenter = e.data.rotateRoundCenter;
    var outfill = e.data.outfill;
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    if (rotateRoundCenter) {
	var hypotenuse = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight);
	var [dstWidth, dstHeight] = [hypotenuse, hypotenuse];
	dstWidth = Math.ceil(dstWidth); dstHeight = Math.ceil(dstHeight);
    } else {
	var [dstWidth, dstHeight] = [srcWidth * 2 , srcHeight * 2];
    }
    var invMat = invertMatrix(affinMatrix, 3);
    //
    var dstImageData = new ImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX, srcY;
	    if (rotateRoundCenter) {
		[srcX, srcY] = affinTransform(dstX, dstY, invMat);
	    } else {
		[srcX, srcY] = affinTransform(dstX - dstWidth / 2,
					      dstY - dstHeight / 2,
					      invMat);
	    }
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    if (rotateRoundCenter) {
		if ((dstX == (dstWidth / 2)) || (dstY === (dstHeight / 2))) {
		    var [r, g, b, a] = rgba;
		    rgba = [r * a, g * a,  b * a, 255];
		}
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function affinTransform(srcX, srcY, mat) {
    var dstX = srcX*mat[0] + srcY*mat[1] + mat[2];
    var dstY = srcX*mat[3] + srcY*mat[4] + mat[5];
    return [dstX, dstY];
}

function scaleAffinTransform(x, y, width, height, mat) {
    var [dstX1, dstY1] = affinTransform(x, y, mat);
    var [dstX2, dstY2] = affinTransform(x+width, y, mat);
    var [dstX3, dstY3] = affinTransform(x, y+height, mat);
    var [dstX4, dstY4] = affinTransform(x+width, y+height, mat);
    var maxX = Math.max(dstX1, dstX2, dstX3, dstX4);
    var minX = Math.min(dstX1, dstX2, dstX3, dstX4);
    var maxY = Math.max(dstY1, dstY2, dstY3, dstY4);
    var minY = Math.min(dstY1, dstY2, dstY3, dstY4);
    return [maxX - minX, maxY - minY];
}
