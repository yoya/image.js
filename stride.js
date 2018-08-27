"use strict";
/*
 * 2018/08/28- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var maxWidthHeightRange = document.getElementById("maxWidthHeightRange");
    var strideRange = document.getElementById("strideRange");
    var strideText = document.getElementById("strideText");
    var maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    var stride = parseFloat(strideRange.value);
    
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    stride = srcCanvas.width;
	    strideRange.value = strideText.value = stride;
	    drawStride(srcCanvas, dstCanvas, stride);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "strideRange":"strideText"},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(maxWidthHeightRange.value);
		     stride = parseFloat(strideRange.value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     if ((target.id === "maxWidthHeightRange") ||
			 (target.id === "maxWidthHeightText")) {
			 strideRange.value = strideText.value = srcCanvas.width;
		     }
		     drawStride(srcCanvas, dstCanvas, stride);
		 } );
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas, maxWidthHeight, stride) {
}


function drawStride(srcCanvas, dstCanvas, stride) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var offset = dstX + dstWidth * dstY;
	    var srcX = offset % stride;
	    var srcY = Math.floor(offset / stride);
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
