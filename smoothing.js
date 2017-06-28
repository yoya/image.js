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
    //
    var filterMatrixTable = document.getElementById("filterMatrixTable");
    var filter = document.getElementById("filterSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    var sigma = parseFloat(document.getElementById("sigmaRange").value);
    var filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);
    document.getElementById("sigmaText").style = "background-color: lightgray";
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
		  "filterWindowRange":"filterWindowText",
		  "sigmaRange":"sigmaText"},
		 function() {
		     filter = document.getElementById("filterSelect").value;
		     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
		     sigma = parseFloat(document.getElementById("sigmaRange").value);
		     if (filter === "gaussianS") {
			 filterWindow = Math.floor(sigma * 5 - 3) * 2 + 1;
			 filterWindow = (filterWindow < 1)?1:filterWindow;
		     }
		     filterMatrix = makeFilterMatrix(filter, filterWindow, sigma);

		     if (filter === "gaussianP") {
			 var center = (filterWindow*filterWindow - 1) / 2;
			 var centerValue = filterMatrix[center];
			 sigma = 1 / Math.sqrt(2 * Math.PI * centerValue);
			 document.getElementById("sigmaRange").value = sigma;
			 document.getElementById("sigmaText").value = document.getElementById("sigmaRange").value;
		     }
		     if (filter === "gaussianS") {
			 document.getElementById("sigmaText").style = "background-color: white";
		     } else {
			 document.getElementById("sigmaText").style = "background-color: lightgray";
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
}

function gaussian(x, y, sigma) {
    var sigma2 = sigma * sigma;
    return Math.exp(- (x*x + y*y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
}

function pascalTriangle(n) {
    var arr = new Uint16Array(n + 1);
    if (n <= 1) {
	return (n <= 0)?[1]:[1, 1];
    }
    var arr1 = pascalTriangle(n-1);
    arr[0] = arr1[0];
    for (var i = 1 ; i < n ; i++) {
	arr[i] = arr1[i-1] +  arr1[i];
    }
    arr[n] = arr1[n-1];
    return arr;
}

function makeFilterMatrix(filter, filterWindow, sigma) {
    var filterArea = filterWindow * filterWindow;
    var filterMatrix = new Float32Array(filterArea);
    var i = 0;
    switch(filter) {
    case "average":
	filterMatrix = filterMatrix.map(function(v) { return 1; });
	break;
    case "gaussianP":
	var pt = pascalTriangle(filterWindow - 1);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		filterMatrix[i++] = pt[x] * pt[y];
	    }
	}1
	break;
    case "gaussianS":
	var center = Math.floor(filterWindow/2);
	for (var y = 0 ; y < filterWindow; y++) {
	    for (var x = 0 ; x < filterWindow; x++) {
		var dx = Math.abs(x - center);
		var dy = Math.abs(y - center);
		filterMatrix[i++] = gaussian(dx, dy, sigma);
	    }
	}
	break;
    }
    // division by sum
    var total = filterMatrix.reduce(function(p, v) {return p+v; });;
    if (total !== 0) {
	filterMatrix = filterMatrix.map(function(v) {
	    return v / total;
	});
    }
    return filterMatrix;
}

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
    worker = new Worker("worker/smoothing.js");
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

