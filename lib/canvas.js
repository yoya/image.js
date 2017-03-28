"use strict";
/*
 * 2017/03/16- (c) yoya@awm.jp
 */

function clamp(x, min, max) {
    if (min < x) {
	return (x < max)? x : max;
    }
    return min;
}

function drawSrcImage(srcImage, dstCanvas, maxWidthHeight) {
    // console.debug("drawSrcImage");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	var resizeScale = maxWidthHeight / ((width > height)?width:height);
	width  *= resizeScale;
	height *= resizeScale;
    }
    dstCanvas.width  = width;
    dstCanvas.height = height;
    dstCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
}

function getRGBA(imageData, x, y) {
    var width = imageData.width, height = imageData.height;
    x = clamp(x, 0, width - 1);
    y = clamp(y, 0, height - 1);
    var offset = 4 * (x + y * width);
    return imageData.data.slice(offset, offset + 4);
}
function setRGBA(imageData, x, y, rgba) {
    var offset = 4 * (x + y * imageData.width);
    var data = imageData.data;
    data[offset++] = rgba[0];
    data[offset++] = rgba[1];
    data[offset++] = rgba[2];
    data[offset++] = rgba[3];
}

function getColorNum(canvas) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var colorMap = {};
    for (var i = 0, n = data.length ; i < n ; i += 4) {
	var colorId = RGBA2colorId(data.slice(i, i+4));
	colorMap[colorId] = true;
    }
    return Object.keys(colorMap).length;
}

function RGBA2colorId(rgba) {
    var [r, g, b, a] = rgba;
    var colorId = (((((r * 0x100) + g) * 0x100) + b) * 0x100) + a;
    return colorId;
}
function colorId2RGBA(colorId) {
    var r = (colorId >> 24) & 0xff;
    var g = (colorId >> 16) & 0xff;
    var b = (colorId >> 8) & 0xff;
    var a = (colorId >> 0) & 0xff;
    return [r, g, b, a];
}

function getColorHistogram(canvas) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var colorHist = {};
    for (var i = 0, n = data.length ; i < n ; i += 4) {
	var colorId = RGBA2colorId(data.slice(i, i+4));
	if (colorId in colorHist) {
	    colorHist[colorId] += 1;
	} else {
	    colorHist[colorId] = 1;
	}
    }
    return colorHist;
}

function getColorIdDistance_nosqrt(colorId1, colorId2) {
    var [r1, g1, b1, a1] = colorId2RGBA(colorId1);
    var [r2, g2, b2, a2] = colorId2RGBA(colorId2);
    var r_diff = r1 - r2;
    var g_diff = g1 - g2;
    var b_diff = b1 - b2;
    var a_diff = a1 - a2;
    return r_diff*r_diff + g_diff*g_diff + b_diff*b_diff + a_diff*a_diff;
}
