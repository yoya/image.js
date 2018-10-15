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

function drawStride(srcCanvas, dstCanvas, stride) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = stride;
    var dstHeight = Math.ceil(srcWidth * srcHeight / stride)
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var n = srcImageData.data.length;
    for (var i = 0 ; i < n ; i++) {
	dstImageData.data[i] = srcImageData.data[i];
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
