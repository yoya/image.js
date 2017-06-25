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

var worker = null;

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, filterMatrix, filterWindow) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var div = loadingStart();
    var srcImageData = srcCanvas.getContext("2d").getImageData(0, 0, srcCanvas.width, srcCanvas.height);
    if (worker) {
	worker.terminate();
    }
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

