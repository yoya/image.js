"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "colorRange":"colorText",
                  "vignetteRange":"vignetteText",
                  "mosaicRange":"mosaicText",
                  "smoothingRange":"smoothingText"},
		 function(target, rel) {
		     drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
}
function drawSrcImageAndShowa(srcImage, srcCanvas, dstCancas, params, sync) {
    const maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas, params, sync);
}

var worker = new workerProcess("worker/showa.js");

function drawShowa(srcCanvas, dstCanvas, params, sync) {
    //console.debug("drawShowa:", params);
    var params_w = {
        color    : params["colorRange"],
        vignette : params["vignetteRange"],
        mosaic   : params["mosaicRange"],
        smoothing: params["smoothingRange"]
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
