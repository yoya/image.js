"use strict";
/*
 * 2017/06/17- (c) yoya@awm.jp
 */

function getRGBA_NN(imageData, x, y, outfill) {
    return getRGBA(imageData, Math.round(x), Math.round(y), outfill);
}

function linearRatio([a, b], p) {
    if (a === b) {
	return [0.5, 0.5];
    }
    var aRatio = (b - p) / (b - a);
    return [aRatio, 1 - aRatio];
}

function getRGBA_BL(imageData, x, y, outfill, homoCoeff) {
    var data = imageData.data;
    var width  = imageData.width;
    var height = imageData.height;
    var x1 = Math.floor(x), x2 = Math.ceil(x);
    var y1 = Math.floor(y), y2 = Math.ceil(y);
    if (x1 < 0) { x1 = 0; } else if (width  <= x2) { x2 = width  - 1; }
    if (y1 < 0) { y1 = 0; } else if (height <= y2) { y2 = height - 1; }
    //
    var rgba11 = getRGBA(imageData, x1, y1, outfill);
    var rgba12 = getRGBA(imageData, x1, y2, outfill);
    var rgba21 = getRGBA(imageData, x2, y1, outfill);
    var rgba22 = getRGBA(imageData, x2, y2, outfill);
    var [rx1, rx2] = linearRatio([x1, x2], x);
    var [ry1, ry2] = linearRatio([y1, y2], y);
    var r11 = rx1 * ry1;
    var r12 = rx1 * ry2;
    var r21 = rx2 * ry1;
    var r22 = rx2 * ry2;
    var rgba = [0, 0, 0, 0];
    for (var i = 0 ; i < 4 ; i++) {
	rgba[i] = r11 * rgba11[i] +  r12 * rgba12[i] +
	    r21 * rgba21[i] + r22 * rgba22[i];
    }
    return rgba;
}
