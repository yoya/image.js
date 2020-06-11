"use strict";
/*
 * 2017/02/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawDotize(srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"scaleRange":"scaleText",
		  "borderRange":"borderText",
		  "borderColorText":null},
		 function() { drawDotize(srcCanvas, dstCanvas, params) },
                 params);
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
                     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawDotize(srcCanvas, dstCanvas, params);
		 }, params);
}

function drawDotize(srcCanvas, dstCanvas, params) {
    // console.debug("drawDotize", params);
    var scale       = params["scaleRange"];
    var border      = params["borderRange"];
    var borderColor = params["borderColorText"];
    var borderRGBA = getRGBAfromHexColor(borderColor);
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth  * scale + (srcWidth  + 1) * border;
    var dstHeight = srcHeight * scale + (srcHeight + 1) * border;
    dstCanvas.width  = dstWidth;
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
		dstData[dstOffset++] = borderRGBA[0];
		dstData[dstOffset++] = borderRGBA[1];
		dstData[dstOffset++] = borderRGBA[2];
		dstData[dstOffset++] = borderRGBA[3];
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
