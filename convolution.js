"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function matResize(filterMatrix, oldFilterWindow, filterWindow) {
    var newMatrix = [];
    for (var y = 0 ; y < filterWindow ; y++) {
        for (var x = 0 ; x < filterWindow ; x++) {
            if ((x < oldFilterWindow) && (y < oldFilterWindow)) {
                newMatrix.push(filterMatrix[x + y * oldFilterWindow]);
            } else {
                newMatrix.push(0);
            }
        }
    }
    return newMatrix;
}

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var filterMatrixTable = document.getElementById("filterMatrixTable");
    var filter = document.getElementById("filterSelect").value;
    var filterWindowRange = document.getElementById("filterWindowRange");
    var filterWindowText = document.getElementById("filterWindowText");
    var [filterMatrix, filterWindow] = filter2Matrix[filter];
    console.log(filterWindow);
    filterWindowRange.value = filterWindow;
    filterWindowText.value = filterWindow;
    console.log(filterWindowRange);
    console.log(filterWindowText);
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
    bindFunction({"filterSelect":null,
                  "filterWindowRange":"filterWindowText"},
		 function(target) {
                     if (target.id === "filterSelect") {
		         filter = document.getElementById("filterSelect").value;
		         [filterMatrix, filterWindow] = filter2Matrix[filter];
                         filterWindowRange.value = filterWindow;
                         filterWindowText.value = filterWindow;
                     } else {
                         var oldFilterWindow = filterWindow;
                         filterWindow = parseFloat(filterWindowRange.value);
                         console.log(filterMatrix);
                         filterMatrix = matResize(filterMatrix, oldFilterWindow, filterWindow);
                         console.log(filterMatrix);
                     }
		     bindTableFunction("filterMatrixTable", function(table, values, width) {
			 filterMatrix = values;
			 filterWindow = width;
			 drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, filterMatrix, filterWindow);
		     }, filterMatrix, filterWindow);
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
    "smoothing2":[
	[0, 0, 0, 0, 0, 0, 0,
	 0, 0, 0, 0, 0, 0, 0,
	 0, 0, 0, 0, 0, 0, 0,
	 1/7, 1/7, 1/7, 1/7, 1/7, 1/7, 1/7,
	 0, 0, 0, 0, 0, 0, 0,
	 0, 0, 0, 0, 0, 0, 0,
	 0, 0, 0, 0, 0, 0, 0,],
	7],
    "smoothing3":[
	[1/7, 0, 0, 0, 0, 0, 0,
	 0, 1/7, 0, 0, 0, 0, 0,
	 0, 0, 1/7, 0, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 0, 1/7, 0, 0,
	 0, 0, 0, 0, 0, 1/7, 0,
	 0, 0, 0, 0, 0, 0, 1/7],
	7],
    "gaussian3x3":[
	[1/16, 1/16, 1/16,
	 2/16, 4/16, 2/16,
	 1/16, 2/16, 1/16],
	3],
    "gaussian5x5":[
	[1/256,  4/256,  6/256,  4/256, 1/256,
	 4/256, 16/256, 24/256, 16/256, 4/256,
	 6/256, 24/256, 36/256, 24/256, 6/256,
	 4/256, 16/256, 24/256, 16/256, 4/256,
	 1/256,  4/256,  6/256,  4/256, 1/256],
	5],
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
    "laplacian1":[
	[0, 1, 0,
	 1, -4, 1,
	 0, 1, 0],
	3],
    "laplacian2":[
	[1, 1, 1,
	 1, -8, 1,
	 1, 1, 1],
	3],
    "edge1":[
	[0, -1, 0,
	 -1, 4, -1,
	 0, -1, 0],
	3],
    "edge2":[
	[-1, -1, -1,
	 -1,  8, -1,
	 -1, -1, -1],
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

var worker = null;

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, filterMatrix, filterWindow) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var srcImageData = srcCanvas.getContext("2d").getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    if (worker) {
	worker.terminate();
    }
    var div = loadingStart();
    worker = new Worker("worker/convolution.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0, 0, 0, dstWidth, dstHeight);
	loadingEnd(div);
	worker = null;
    }
    worker.postMessage({image:srcImageData,
			filterMatrix:filterMatrix, filterWindow:filterWindow},
                       [srcImageData.data.buffer]);
}
