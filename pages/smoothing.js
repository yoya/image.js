"use strict";
/*
 * 2017/06/28- (c) yoya@awm.jp
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
    //
    var filterMatrixTable = document.getElementById("filterMatrixTable");
    var filter, filterWindow, sigma, filterMatrix;  // set after bindParams
    // document.getElementById("sigmaText").style = "background-color: lightgray";
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight"]});
    bindParams(params, function(key, target, rel) {
		     filter       = params.filter;
		     filterWindow = params.filterWindow;
		     sigma        = params.sigma;
		     var colorScale = params.colorScale;
		     if (filter === "gaussian") {
			 filterWindow = Math.floor(sigma * 5 - 3) * 2 + 1;
			 filterWindow = (filterWindow < 1)?1:filterWindow;
			 params.filterWindow = filterWindow;
			 syncParamsToElements(params, {keys: ["filterWindow"]});
			 filterWindow = params.filterWindow;  // clamped by the range
		     }
		     filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);
                     params["filterMatrix"] = filterMatrix;

		     if (filter === "pascal") {
			 var center = (filterWindow*filterWindow - 1) / 2;
			 var centerValue = filterMatrix[center];
			 sigma = 1 / Math.sqrt(2 * Math.PI * centerValue);
			 params.sigma = sigma;
			 syncParamsToElements(params, {keys: ["sigma"]});
			 sigma = params.sigma;  // rounded by the range step
		     }
		     if (filter === "gaussian") {
			 ;
			 // document.getElementById("sigmaText").style = "background-color: white";
			 // document.getElementById("filterWindowText").style = "background-color: lightgray";
		     } else {
			 ;
			 // document.getElementById("filterWindowText").style = "background-color: white";
			 // document.getElementById("sigmaText").style = "background-color: lightgray";
		     }
		     bindTableFunction("filterMatrixTable", function(table, values, width) {
			 params["filterMatrix"] = filterMatrix = values;
			 filterWindow = width;
			 drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, true);
		     }, filterMatrix, filterWindow);
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, rel);
		     setTableValues("filterMatrixTable", filterMatrix);
		 }, {keys: ["filter", "filterWindow", "sigma", "bilateral", "colorScale"]});
    filter       = params.filter;
    filterWindow = params.filterWindow;
    sigma        = params.sigma;
    filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);
    params["filterMatrix"] = filterMatrix;
    //
    bindTableFunction("filterMatrixTable", function(table, values, width) {
	params["filterMatrix"] = filterMatrix = values;
	filterWindow = width;
	drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, true);
    }, filterMatrix, filterWindow);
}


function makeFilterMatrix(filter, filterWindow, sigma) {
    console.debug("makeFilterMatrix:", filter, filterWindow, sigma);
    var filterArea = filterWindow * filterWindow;
    var filterMatrix = new Float32Array(filterArea);
    var i = 0;
    switch(filter) {
    case "average":
        var n = filterWindow * filterWindow;
	filterMatrix = filterMatrix.map(function(v) { return 1 / n; });
	break;
    case "pascal":
        filterMatrix = makeKernel_PascalTriangle_2D(filterWindow);
	break;
    case "gaussian":
        filterMatrix = makeKernel_Gaussian(filterWindow, sigma);
	break;
    }
    return filterMatrix;
}

var worker = new workerProcess("worker/smoothing.js");

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, sync) {
    var maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var params_w = {
        filterMatrix: params["filterMatrix"],
        filterWindow: params.filterWindow,
	sigma       : params.sigma,
        bilateral   : params.bilateral,
        colorScale  : params.colorScale,
    };
    // console.debug(params_w);
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}

