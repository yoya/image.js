'use strict';
/*
 * 2017/04/21- (c) yoya@awm.jp
 * 2017/07/02- (c) yoya@awm.jp WebWorker
 */

importScripts('../lib/matrix.js');
importScripts('../lib/canvas.js');

onmessage = function(e) {
    console.debug('worker/onmessage:', e);
    const srcImageData = e.data.image;
    const affinMatrix = e.data.affinMatrix;
    const outfill = e.data.outfill;
    const srcWidth = srcImageData.width; const srcHeight = srcImageData.height;
    let [dstWidth, dstHeight] = scaleAffinTransform(0, 0, srcWidth, srcHeight, affinMatrix);
    dstWidth = Math.floor(dstWidth); dstHeight = Math.floor(dstHeight);
    const invMat = invertMatrix(affinMatrix, 3);
    //
    const dstImageData = new ImageData(dstWidth, dstHeight);
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    let [srcX, srcY] = affinTransform(dstX, dstY, invMat);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    const rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function affinTransform(srcX, srcY, mat) {
    const dstX = srcX * mat[0] + srcY * mat[1] + mat[2];
    const dstY = srcX * mat[3] + srcY * mat[4] + mat[5];
    return [dstX, dstY];
}

function scaleAffinTransform(x, y, width, height, mat) {
    const [dstX1, dstY1] = affinTransform(x, y, mat);
    const [dstX2, dstY2] = affinTransform(x + width, y, mat);
    const [dstX3, dstY3] = affinTransform(x, y + height, mat);
    const [dstX4, dstY4] = affinTransform(x + width, y + height, mat);
    const maxX = Math.max(dstX1, dstX2, dstX3, dstX4);
    const minX = Math.min(dstX1, dstX2, dstX3, dstX4);
    const maxY = Math.max(dstY1, dstY2, dstY3, dstY4);
    const minY = Math.min(dstY1, dstY2, dstY3, dstY4);
    return [maxX - minX, maxY - minY];
}
