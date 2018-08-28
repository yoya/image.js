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
    var scanlineRange = document.getElementById("scanlineRange");
    var scanlineText = document.getElementById("scanlineText");
    var maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    var scanline = parseFloat(scanlineRange.value);
    
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    scanline = srcCanvas.width;
	    scanlineRange.value = scanlineText.value = scanline;
	    drawScanline(srcCanvas, dstCanvas, scanline);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "scanlineRange":"scanlineText"},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(maxWidthHeightRange.value);
		     scanline = parseFloat(scanlineRange.value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     if ((target.id === "maxWidthHeightRange") ||
			 (target.id === "maxWidthHeightText")) {
			 scanlineRange.value = scanlineText.value = srcCanvas.width;
		     }
		     drawScanline(srcCanvas, dstCanvas, scanline);
		 } );
}

function drawScanline(srcCanvas, dstCanvas, scanline) {
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
	    var srcX = offset % scanline;
	    var srcY = Math.floor(offset / scanline);
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
