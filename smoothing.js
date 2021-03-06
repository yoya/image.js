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
    var filter = document.getElementById("filterSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    var sigma = parseFloat(document.getElementById("sigmaRange").value);
    var colorScale = parseFloat(document.getElementById("colorScaleRange").value);
    var filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);
    params["filterMatrix"] = filterMatrix;
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
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
    bindFunction({"filterSelect":null,
		  "filterWindowRange":"filterWindowText",
		  "sigmaRange":"sigmaText",
		  "bilateralCheckbox":null,
		  "colorScaleRange":"colorScaleText",},
		 function(target, rel) {
		     filter       = params["filterSelect"];
		     filterWindow = params["filterWindowRange"];
		     sigma        = params["sigmaRange"];
		     var colorScale = params["colorScaleRange"];
		     if (filter === "gaussian") {
			 filterWindow = Math.floor(sigma * 5 - 3) * 2 + 1;
			 filterWindow = (filterWindow < 1)?1:filterWindow;
			 document.getElementById("filterWindowRange").value = filterWindow;
                         filterWindow = document.getElementById("filterWindowRange").value;
			 document.getElementById("filterWindowText").value = filterWindow;
                         params["filterWindowRange"] = parseFloat(filterWindow);
		     }
		     filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);
                     params["filterMatrix"] = filterMatrix;

		     if (filter === "pascal") {
			 var center = (filterWindow*filterWindow - 1) / 2;
			 var centerValue = filterMatrix[center];
			 sigma = 1 / Math.sqrt(2 * Math.PI * centerValue);
			 document.getElementById("sigmaRange").value = sigma;
                         sigma = document.getElementById("sigmaRange").value;
			 document.getElementById("sigmaText").value = sigma;
                         params["sigmaRange"] = parseFloat(sigma);
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
		 }, params);
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
        filterMatrix = makeKernel_PascalTriangle(filterWindow);
	break;
    case "gaussian":
        filterMatrix = makeKernel_Gaussian(filterWindow, sigma);
	break;
    }
    return filterMatrix;
}

var worker = new workerProcess("worker/smoothing.js");

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, params, sync) {
    var maxWidthHeight = params["maxWidthHeightRange"];
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var params_w = {
        filterMatrix: params["filterMatrix"],
        filterWindow: params["filterWindowRange"],
	sigma       : params["sigmaRange"],
        bilateral   : params["bilateralCheckbox"],
        colorScale  : params["colorScaleRange"],
    };
    // console.debug(params_w);
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}

