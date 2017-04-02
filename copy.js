"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas);
}


function drawCopy(srcCanvas, dstCanvas) {
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
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var srcOffset = 4 * (srcX + srcY * srcWidth);
	    var dstOffset = 4 * (dstX + dstY * dstWidth);
	    dstData[dstOffset++] = srcData[srcOffset++];
	    dstData[dstOffset++] = srcData[srcOffset++];
	    dstData[dstOffset++] = srcData[srcOffset++];
	    dstData[dstOffset++] = srcData[srcOffset++];
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
