"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
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
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "radiusRange":"radiusText",
		  "linearGammaCheckbox":null,
		  "inverseCheckbox":null},
		 function(target, rel) {
		     drawSrcImageAndVinette(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
}

function drawSrcImageAndVinette(srcImage, srcCanvas, dstCancas, params, sync) {
    var maxWidthHeight = params["maxWidthHeightRange"];
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawVinette(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/vinette.js");

function drawVinette(srcCanvas, dstCanvas, params, sync) {
    var params_w = {
        radius     : params["radiusRange"],
        linearGamma: params["linearGammaCheckbox"],
        inverse    : params["inverseCheckbox"],
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
