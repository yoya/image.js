"use strict";
/*
* 2016/11/13- yoya@awm.jp . All Rights Reserved.
*/

main();

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "filterType":null,
		  "scaleRange":"scaleText",
		  "cubicBRange":"cubicBText",
		  "cubicCRange":"cubicCText",
		  "lobeRange":"lobeText"},
		 function() {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas);
		 } );
}

var worker = null;

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var params = {
	filterType: document.getElementById("filterType").value,
	scale: parseFloat(document.getElementById("scaleRange").value),
	cubicB:parseFloat(document.getElementById("cubicBRange").value),
	cubicC:parseFloat(document.getElementById("cubicCRange").value),
	lobe:  parseFloat(document.getElementById("lobeRange").value)
    };
    drawGraph(params)
    var srcWidth  = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    if (worker) {
	worker.terminate();
    }
    worker = new Worker("worker/rescale.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth  = dstImageData.width;
	var dstHeight = dstImageData.height;
	dstCanvas.width = dstWidth;
	dstCanvas.height = dstHeight;
	dstCtx.putImageData(dstImageData, 0, 0);
    }
    worker.postMessage({image:srcImageData, params:params},
                       [srcImageData.data.buffer]);
}

