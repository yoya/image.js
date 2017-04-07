"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var filterTable = document.getElementById("filterTable");
    var filter = document.getElementById("filterSelect").value;    srcCanvas.style.border = "thick solid red";
    var filterMatrix = null;
    var filterWindow = null;
    dstCanvas.style.border = "thick solid blue";
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "filterSelect":null},
		 function() {
		     filter = document.getElementById("filterSelect").value;    srcCanvas.style.border = "thick solid red";
		     [filterMatrix, filterWindow] = selectFilterMatrix(filter);
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
		 } );
    [filterMatrix, filterWindow] = selectFilterMatrix(filter);
}

function selectFilterMatrix(filter) {
    console.debug("selectFilterMatrix("+filter+")");
    var filterMatrix = null;;
    var filterWindow = 3;
    switch (filter) {
    case "smoothing":
	var v = 1/9;
	filterMatrix = [v, v, v,
			v, v, v,
			v, v, v];
	break;
    case "differentialHoli":
	filterMatrix = [0, 0, 0,
			0, -1, 1,
			0, 0, 0];
	break;
    case "differentialVert":
	filterMatrix = [0, 1, 0,
			0, -1, 0,
			0, 0, 0];
	break;
    case "differential":
	filterMatrix = [0, 1, 0,
			0, -2, 1,
			0, 0, 0];
	break;
    case "laplacian":
	filterMatrix = [0, 1, 0,
			1, -4, 1,
			0, 1, 0];
	break;
    case "sharpening1":
	filterMatrix = [ 0, -1,  0,
			 -1,  5, -1,
			 0, -1,  0];
	break;
    case "sharpening2":
	filterMatrix = [-1, -1, -1,
			-1,  9, -1,
			-1, -1, -1];
	break;
    case "emboss":
	filterMatrix = [1, 0,  0,
			0, 0,  0,
			0, 0, -1];
	break;
    case "prewitt":
	filterMatrix = [-2, -1, 0,
			-1, 0,  1,
			0, 1, 2];
	break;
    case "sobel":
	filterMatrix = [-2, -2, 0,
			-2,  0, 2,
			0,  2, 2];
	break;
    default:
	console.error("Unknown filter:"+filter);
    }
    return [filterMatrix, filterWindow];
}

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, filterMatrix, filterWindow) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawConvolution(srcCanvas, dstCanvas, filterMatrix, filterWindow);
}

function convolution(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    r2 += r * filterMatrix[i];
	    g2 += g * filterMatrix[i];
	    b2 += b * filterMatrix[i];
	    i++;
	}
    }
    return [r2, g2, b2, a];
}

function drawConvolution(srcCanvas, dstCanvas, filterMatrix, filterWindow) {
    // console.debug("drawConvolution");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var filter = document.getElementById("filterSelect").value;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = convolution(srcImageData, srcX, srcY, filterMatrix, filterWindow);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
