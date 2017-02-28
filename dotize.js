"use strict";
/*
 * 2017/02/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var srcCanvas = document.getElementById("srcCanvas");
var dstCanvas = document.getElementById("dstCanvas");
var srcImage = new Image();

function main() {
    // console.debug("main");
    dropFunction(document, function(dataURL) {
	srcImage.onload = function() {
	    drawSrcImage();
	    drawDotize();
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", "scaleRange", "scaleText", drawDotize);
    bindFunction("range2text", "borderRange", "borderText", drawDotize);
    bindFunction("range2text", "maxWidthRange", "maxWidthText", function() {
	drawSrcImage();
	drawDotize();
    });
    bindFunction("range2text", "maxHeightRange", "maxHeightText", function() {
	drawSrcImage();
	drawDotize();
    });
}


function drawSrcImage() {
    // console.debug("drawSrcImage");
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    var maxWidth = parseFloat(document.getElementById("maxWidthRange").value);
    var maxHeight = parseFloat(document.getElementById("maxHeightRange").value);
    if ((maxWidth < width) || (maxHeight < height)) {
	var resizeScaleWidth = maxWidth / width;
	var resizeScaleHeight = maxHeight / height;
	var resizeScale = (resizeScaleWidth < resizeScaleHeight)?resizeScaleWidth:resizeScaleHeight;
	width *= resizeScale;
	height *= resizeScale;
    }
    srcCanvas.width  = width;
    srcCanvas.height = height;
    srcCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
}
function drawDotize() {
    // console.debug("drawDotize");
    var scale = parseFloat(document.getElementById("scaleRange").value);
    var border = parseFloat(document.getElementById("borderRange").value);
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = dstCanvas.width, dstHeight = dstCanvas.height;
    var dstWidth = srcWidth * scale + (srcWidth + 1) * border;
    var dstHeight = srcHeight * scale + (srcHeight + 1) * border;
    dstCanvas.width = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = Math.floor(dstX / (scale+border));
	    var srcY = Math.floor(dstY / (scale+border));
	    var srcOffset = 4 * (srcX + srcY * srcWidth);
	    var dstOffset = 4 * (dstX + dstY * dstWidth);
	    if (((dstX % (scale+border)) < border) ||
		((dstY % (scale+border)) < border)) {
		dstData[dstOffset++] = 0
		dstData[dstOffset++] = 0
		dstData[dstOffset++] = 0
		dstData[dstOffset++] = 255;
	    } else {
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
		dstData[dstOffset++] = srcData[srcOffset++];
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
