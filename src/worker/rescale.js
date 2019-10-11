'use strict';
/*
* 2016/11/13- yoya@awm.jp . All Rights Reserved.
* 2017/07/01- (c) yoya@awm.jp webworker
*/

importScripts('../lib/canvas.js');
importScripts('../lib/math.js');
importScripts('../lib/interpolate.js');

onmessage = function(e) {
    // console.debug("worker/rescale onmessage", e);
    const srcImageData = e.data.image;
    const params = e.data;
    const scale = params.scale;
    const filterType = params.filterType;
    const srcWidth  = srcImageData.width;
    const srcHeight = srcImageData.height;
    const dstWidth  = Math.round(scale * srcWidth);
    const dstHeight = Math.round(scale * srcHeight);
    const dstImageData = new ImageData(dstWidth, dstHeight);
    const dstData = dstImageData.data;
    for (let dstY = 0; dstY < dstHeight; dstY++) {
	for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const dstOffset = 4 * (dstX + dstY * dstWidth);
	    const srcX = dstX / scale;
	    const srcY = dstY / scale;
	    const [r, g, b, a] = rescalePixel(srcX, srcY, srcImageData, filterType);
	    setRGBA(dstImageData, dstX, dstY, [r, g, b, a]);
	}
    }
    postMessage({ image:dstImageData }, [dstImageData.data.buffer]);
};

function getRGBA_NN(imageData, x, y) {
    return getRGBA(imageData, Math.floor(x), Math.floor(y));
}

function linearRatio([a, b], p) {
    if (a === b) {
	return [0.5, 0.5];
    }
    const aRatio = (b - p) / (b - a);
    return [aRatio, 1 - aRatio];
}

function getRGBA_BiLinear(imageData, x, y) {
    const data = imageData.data;
    const width  = imageData.width;
    const height = imageData.height;
    let x1 = Math.floor(x); let x2 = Math.ceil(x);
    let y1 = Math.floor(y); let y2 = Math.ceil(y);
    if (x1 < 0) {
	x1 = 0;
    } else if (width <= x2) {
	x2 = width - 1;
    }
    if (y1 < 0) {
	y1 = 0;
    } else if (height <= y2) {
	y2 = height - 1;
    }
    const rgba = [0, 0, 0, 0];
    const [rx1, rx2] = linearRatio([x1, x2], x);
    const [ry1, ry2] = linearRatio([y1, y2], y);
    const r11 = rx1 * ry1;
    const r12 = rx1 * ry2;
    const r21 = rx2 * ry1;
    const r22 = rx2 * ry2;
    const rgba11 = getRGBA(imageData, x1, y1);
    const rgba12 = getRGBA(imageData, x1, y2);
    const rgba21 = getRGBA(imageData, x2, y1);
    const rgba22 = getRGBA(imageData, x2, y2);
    for (let i = 0; i < 4; i++) {
	rgba[i] = r11 * rgba11[i] +  r12 * rgba12[i] + r21 * rgba21[i] + r22 * rgba22[i];
    }
    return rgba;
}

function rescalePixel(srcX, srcY, srcImageData, filterType) {
    let rgba = null;
    switch (filterType) {
    case 'NN':
	rgba = getRGBA_NN(srcImageData, srcX, srcY);
	break;
    case 'BiLinear':
	rgba = getRGBA_BiLinear(srcImageData, srcX, srcY);
	break;
    default:
	rgba = [255, 0, 0, 255];
	break;
    }
    return rgba;
}
