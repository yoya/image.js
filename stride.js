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
		  "strideRange":"strideText",
		  "laplacianButton":null},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(maxWidthHeightRange.value);
		     stride = parseFloat(strideRange.value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     if ((target.id === "maxWidthHeightRange") ||
			 (target.id === "maxWidthHeightText")) {
			 strideRange.value = strideText.value = srcCanvas.width;
		     }
		     if (target.id === "laplacianButton") {
			 stride = laplacianSearch(srcCanvas);
			 strideRange.value = strideText.value = srcCanvas.width = stride;
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
    var n = 4 * srcImageData.width * srcImageData.height;
    for (var i = 0 ; i < n ; i++) {
	dstImageData.data[i] = srcImageData.data[i];
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

var laplacianMatrix = 
    [0, 1, 0,
     1, -4, 1,
     0, 1, 0];

function  laplacianMean(canvas) {
    var width = canvas.width;
    var height = canvas.height;
    var total = 0;
    var ctx = canvas.getContext("2d");
    var image = ctx.getImageData(0, 0, width, height);
    for (var y = 0 ; y < height - 2 ; y++) {
	for (var x = 0 ; x < width - 2 ; x++) {
	    var rgbaL = [
		getRGBA(image, x    , y),
		getRGBA(image, x + 1, y + 1),
		getRGBA(image, x + 2, y + 2),
		getRGBA(image, x    , y),
		getRGBA(image, x + 1, y + 1),
		getRGBA(image, x + 2, y + 2),
		getRGBA(image, x    , y),
		getRGBA(image, x + 1, y + 1),
		getRGBA(image, x + 2, y + 2)
	    ].reduce(function(rgba1, rgba2, i) {
		if (i === 1) {
		    var m1 = laplacianMatrix[1];
		    return [
			rgba2[0] * m1, rgba2[1] * m1,
			rgba2[2] * m1, rgba2[3] * m1 ];
		} else {
		    var mi = laplacianMatrix[i];
		    return [
			rgba1[0] + rgba2[0] * mi,
			rgba1[1] + rgba2[1] * mi,
			rgba1[2] + rgba2[2] * mi,
			rgba1[3] + rgba2[3] * mi ];
		}
	    });
	    total += rgbaL[0] + rgbaL[1] + rgbaL[2] +rgbaL[3];
	}
    }
    return Math.abs(total / (width-2) / (height-2));
}
    
function  laplacianSearch(srcCanvas) {
    var minStride = 8;
    var maxStride = srcCanvas.width * 2;
    var minMean = Number.MAX_VALUE;
    var stride = 0;
    var tmpCanvas = document.createElement("canvas");
    for (var tmpStride = minStride ; tmpStride <= maxStride ; tmpStride++) {
	drawStride(srcCanvas, tmpCanvas, tmpStride)
	var mean = laplacianMean(tmpCanvas);
	if (mean < minMean) {
	    stride = tmpStride;
	    minMean = mean;
	}
	console.log(tmpStride, mean, stride);
    }
    console.log("stride:"+stride);
    return stride;
}
