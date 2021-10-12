"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function matResize(filterMatrix, oldFilterWindow, filterWindow) {
    var newMatrix = [];
    var offset = (oldFilterWindow - filterWindow) / 2;
    for (var y = 0 ; y < filterWindow ; y++) {
        for (var x = 0 ; x < filterWindow ; x++) {
            var xx = x + offset, yy = y + offset;
            if ((0 <= xx) && (xx < oldFilterWindow) &&
                (0 <= yy) && (yy < oldFilterWindow)) {
                newMatrix.push(filterMatrix[xx + yy * oldFilterWindow]);
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
    var params = {};
    //
    var filterSelect = document.getElementById("filterSelect");
    var filterWindowRange = document.getElementById("filterWindowRange");
    var filterWindowText  = document.getElementById("filterWindowText");
    //
    var filter = filterSelect.value;
    var [filterMatrix, filterWindow] = filter2Matrix[filter];
    params["filterMatrix"] = filterMatrix;
    params["filterWindow"] = filterWindow;
    filterWindowRange.value = filterWindow;
    filterWindowText.value = filterWindow;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params);
		 }, params);
    bindFunction({"filterSelect":null,
                  "filterWindowRange":"filterWindowText",
                  "matrixNormalizeCheckbox":null,
                  "matrixZerocenteringCheckbox":null,
                  "linearRGBCheckbox":null,
                  "imageNormalizeCheckbox":null},
		 function(target) {
                     if (target.id === "filterSelect") {
		         filter = params["filterSelect"];
		         [filterMatrix, filterWindow] = filter2Matrix[filter];
                         filterWindowRange.value = filterWindow;
                         filterWindowText.value  = filterWindow;
                         params["filterWindowRange"] = filterWindow;
                         params["filterWindowText"]  = filterWindow;
                     } else {
                         var oldFilterWindow = filterWindow;
                         filterWindow = params["filterWindowRange"];
                         filterMatrix = matResize(filterMatrix, oldFilterWindow, filterWindow);
                     }
                     params["filterMatrix"] = filterMatrix;
                     params["filterWindow"] = filterWindow;
		     bindTableFunction("filterMatrixTable", function(table, values, width) {
			 params["filterMatrix"] = filterMatrix = values;
			 drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params);
		     }, filterMatrix, filterWindow);
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params);
		     setTableValues("filterMatrixTable", filterMatrix);
		 }, params);
    //
    bindTableFunction("filterMatrixTable", function(table, values, width) {
	params["filterMatrix"] = filterMatrix = values;
	drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params);
    }, filterMatrix, filterWindow);
    //
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
    "smoothing4":[
	[0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0,
	 0, 0, 0, 1/7, 0, 0, 0],
	7],
    "gaussian3x3":[  // 1 2 1 (pascal triangle)
	[1/16, 1/16, 1/16,
	 2/16, 4/16, 2/16,
	 1/16, 2/16, 1/16],
	3],
    "gaussian5x5":[  // 1 3 6 3 1
	[1/256,  4/256,  6/256,  4/256, 1/256,
	 4/256, 16/256, 24/256, 16/256, 4/256,
	 6/256, 24/256, 36/256, 24/256, 6/256,
	 4/256, 16/256, 24/256, 16/256, 4/256,
	 1/256,  4/256,  6/256,  4/256, 1/256],
	5],
    "gaussian7x7":[  // 1 6 15 20 15 6 1
	[ 1/4096,   6/4096,  15/4096,  20/4096,  15/4096,   6/4096,  1/4096,
	  6/4096,  36/4096,  90/4096, 120/4096,  90/4096,  36/4096,  6/4096,
	 15/4096,  90/4096, 225/4096, 300/4096, 255/4096,  90/4096, 15/4096,
	 20/4096, 120/4096, 300/4096, 400/4096, 300/4096, 120/4096, 20/4096,
	 15/4096,  90/4096, 225/4096, 300/4096, 255/4096,  90/4096, 15/4096,
	  6/4096,  36/4096,  90/4096, 120/4096,  90/4096,  36/4096,  6/4096,
	  1/4096,   6/4096,  15/4096,  20/4096,  15/4096,   6/4096,  1/4096],
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
    "sharpening0.5":[
	[  0,  -0.5, 0,
	  -0.5, 3,  -0.5,
	   0,  -0.5, 0],
	3],
    "sharpening1":[
	[ 0, -1,  0,
	  -1,  5, -1,
	  0, -1,  0],
	3],
    "sharpening1.25":[
	[-0.25, -1, -0.25,
	 -1,     6, -1,
	 -0.25, -1, -0.25],
	3],
    "sharpening1.5":[
	[-0.5, -1, -0.5,
	 -1,    7, -1,
	 -0.5, -1, -0.5],
	3],
    "sharpening1.75":[
	[-0.75, -1, -0.75,
	 -1,     8, -1,
	 -0.75, -1, -0.75],
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

var worker = new workerProcess("worker/convolution.js");

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, params) {
    var maxWidthHeight = params["maxWidthHeightRange"];
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var filterMatrix = params["filterMatrix"];
    var filterWindow = params["filterWindow"];
    var matrixNormalize = params["matrixNormalizeCheckbox"];
    var zerocentering   = params["matrixZerocenteringCheckbox"];
    var linearRGB       = params["linearRGBCheckbox"];
    var imageNormalize  = params["imageNormalizeCheckbox"];
    //
    if (matrixNormalize) {
        var total = filterMatrix.reduce(function(a, b) { return a + b; });
        filterMatrix = filterMatrix.map(function(a) { return a / total });
    }
    if (zerocentering) {
        var total = filterMatrix.reduce(function(a, b) { return a + b; });
        filterMatrix = filterMatrix.map(function(a) { return a - (total / filterWindow / filterWindow) });
    }
    var params_w = {
        filterMatrix:filterMatrix,
        filterWindow:filterWindow,
        linearRGB:linearRGB,
        imageNormalize:imageNormalize,
    };
    worker.process(srcCanvas, dstCanvas, params_w, true);
}
