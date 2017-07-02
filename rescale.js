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
		 function(target, rel) {
		     drawSrcImageAndRescale(srcImage, srcCanvas, dstCanvas, rel);
		 } );
}

var worker = new workerProcess("worker/rescale.js");

function drawSrcImageAndRescale(srcImage, srcCanvas, dstCancas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);    
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var params = {
	filterType: document.getElementById("filterType").value,
	scale: parseFloat(document.getElementById("scaleRange").value),
	cubicB:parseFloat(document.getElementById("cubicBRange").value),
	cubicC:parseFloat(document.getElementById("cubicCRange").value),
	lobe:  parseFloat(document.getElementById("lobeRange").value)
    };
    drawGraph(params);
    worker.process(srcCanvas, dstCanvas, params, sync);
}
