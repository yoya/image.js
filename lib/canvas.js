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
