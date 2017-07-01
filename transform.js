"use strict";
/*
 * 2017/04/21- (c) yoya@awm.jp
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
    var affinMatrixTable = document.getElementById("affinMatrixTable");
    var rotateAroundZero = document.getElementById("rotateAroundZeroCheckbox").checked;
    var outfill = document.getElementById("outfillSelect").value;
    outfill = outfillStyleNumber(outfill);
    var affinMatrix = [1, 0, 0,
		       0, 1, 0,
		       0, 0, 1];
    var affinWindow = 3;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    affinMatrix = makeAffinMatrix(srcCanvas, rotateAroundZero);
	    setTableValues("affinMatrixTable", affinMatrix);
	    drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "rotateAroundZeroCheckbox":null,
		  "rotateRange":"rotateText",
		  "transXRange":"transXText",
		  "transYRange":"transYText",
		  "outfillSelect":null},
		 function(target, rel) {
		     // console.debug("bindFunction:", target.id, rel);
		     var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     rotateAroundZero = document.getElementById("rotateAroundZeroCheckbox").checked;
		     outfill = document.getElementById("outfillSelect").value;
		     outfill = outfillStyleNumber(outfill);
		     affinMatrix = makeAffinMatrix(srcCanvas, rotateAroundZero);
		     setTableValues("affinMatrixTable", affinMatrix);
		     drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill, rel);
		 } );
    //
    bindTableFunction("affinMatrixTable", function(table, values, width) {
	affinMatrix = values;
	drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill);
    }, affinMatrix, affinWindow);
}

function makeAffinMatrix(canvas, rotateAroundZero) {
    var width = canvas.width, height = canvas.height;
    var rotate = parseFloat(document.getElementById("rotateRange").value);
    var transX = parseFloat(document.getElementById("transXRange").value);
    var transY = parseFloat(document.getElementById("transYRange").value);
    var theta = 2 * Math.PI * rotate / 360;
    var mat = [Math.cos(theta), -Math.sin(theta), 0,
	       Math.sin(theta),  Math.cos(theta), 0,
	       0, 0, 1];
    var leftX, topY;
    mat[2] = transX * width;
    mat[5] = transY * height;
    if (rotateAroundZero === false) {
	var hypotenuse = Math.sqrt(width*width + height*height);
	mat[2] += (- mat[0] * width - mat[1] * height + hypotenuse) / 2;
	mat[5] += (- mat[3] * width - mat[4] * height + hypotenuse) / 2;
    }
    return mat;
};

var worker = new Worker("worker/transform.js");
var workerRunning = false;
var workerQueue = [];

function drawAffinTransform(srcCanvas, dstCanvas, affinMatrix, rotateAroundZero, outfill, rel) {
    // console.debug("drawAffinTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);

    var div = loadingStart();

    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0);
	loadingEnd(div);
	workerRunning = false;
	if (0 < workerQueue.length) {
	    var [message, transferHint] = workerQueue.shift();
	    workerRunning = true;
	    worker.postMessage(message, transferHint);
	}
    }
    var message = {image:srcImageData, affinMatrix:affinMatrix,
		   rotateAroundZero:rotateAroundZero, outfill:outfill}
    var transferHint = [srcImageData.data.buffer];
    if (workerRunning) {
	if (1 < workerQueue.length) {
	    workerQueue.shift();
	}
	workerQueue.push([message, transferHint]);
    } else {
	workerRunning = true;
	worker.postMessage(message, transferHint);
    }
}
