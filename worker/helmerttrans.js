"use strict";
/*
 * 2024/04/13- (c) yoya@awm.jp
 */

importScripts("../lib/matrix.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    // console.debug("worker/onmessage:", e);
    var srcImageData = e.data.image;
    var helmertMatrix = e.data.helmertMatrix;
    var outfill = e.data.outfill;
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var squareMat = extendToSquareMatrix(helmertMatrix, 3)
    var [dstWidth, dstHeight] = scaleHelmertTransform(0, 0, srcWidth, srcHeight, helmertMatrix);
    dstWidth = Math.floor(dstWidth); dstHeight = Math.floor(dstHeight);
    var invMat = invertMatrix(squareMat, 3);
    //
    var dstImageData = new ImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var [srcX, srcY] = helmertTransform(dstX, dstY, invMat);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function helmertTransform(srcX, srcY, mat) {
    var dstX = srcX*mat[0] + srcY*mat[1] + mat[2];
    var dstY = srcX*mat[3] + srcY*mat[4] + mat[5];
    return [dstX, dstY];
}

function scaleHelmertTransform(x, y, width, height, mat) {
    var [dstX1, dstY1] = helmertTransform(x, y, mat);
    var [dstX2, dstY2] = helmertTransform(x+width, y, mat);
    var [dstX3, dstY3] = helmertTransform(x, y+height, mat);
    var [dstX4, dstY4] = helmertTransform(x+width, y+height, mat);
    var maxX = Math.max(dstX1, dstX2, dstX3, dstX4);
    var minX = Math.min(dstX1, dstX2, dstX3, dstX4);
    var maxY = Math.max(dstY1, dstY2, dstY3, dstY4);
    var minY = Math.min(dstY1, dstY2, dstY3, dstY4);
    return [maxX - minX, maxY - minY];
}
