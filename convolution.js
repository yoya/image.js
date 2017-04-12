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
    srcCanvas.style.border = "thick solid red";
    dstCanvas.style.border = "thick solid blue";
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var filterMatrixTable = document.getElementById("filterMatrixTable");
    var filter = document.getElementById("filterSelect").value;
    var [filterMatrix, filterWindow] = filter2Matrix[filter];
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
		 } );
    bindFunction({"filterSelect":null},
		 function() {
		     filter = document.getElementById("filterSelect").value;
		     [filterMatrix, filterWindow] = filter2Matrix[filter];
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
		     setTableValues("filterMatrixTable", filterMatrix);
		 } );
    //
    bindTableFunction("filterMatrixTable", function(table, values, width) {
	filterMatrix = values;
	filterWindow = width;
	 drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
    }, filterMatrix, filterWindow);
    console.log(filterMatrixTable);
}

var filter2Matrix = {
    // filterName:[
    // filterMatrix,
    // filterWindow],
    "smoothing":[
	[1/9, 1/9, 1/9,
	 1/9, 1/9, 1/9,
	 1/9, 1/9, 1/9],
	3],
    "differentialHoli":[
	[0, 0, 0,
	 0, -1, 1,
	 0, 0, 0],
	3],
    "differentialVert":[
	[0, 1, 0,
	 0, -1, 0,
	 0, 0, 0],
	3],
    "differential":[
	[0, 1, 0,
	 0, -2, 1,
	 0, 0, 0],
	3],
    "laplacian":[
	[0, 1, 0,
	 1, -4, 1,
	 0, 1, 0],
	3],
    "sharpening1":[
	[ 0, -1,  0,
	  -1,  5, -1,
	  0, -1,  0],
	3],
    "sharpening2":[
	[-1, -1, -1,
	 -1,  9, -1,
	 -1, -1, -1],
	3],
    "emboss":[
	[1, 0,  0,
	 0, 0,  0,
	 0, 0, -1],
	3],
    "prewitt":[
	[-2, -1, 0,
	 -1, 0,  1,
	 0, 1, 2],
	3],
    "sobel":[
	[-2, -2, 0,
	 -2,  0, 2,
	 0,  2, 2],
	3],
};

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
