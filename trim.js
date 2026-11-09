"use strict";
/*
 * 2017/06/23- (c) yoya@awm.jp
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
            let maxWidthHeight = params.maxWidthHeight;
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawTrim(srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindParams(params, function(key, target, rel) {
                     let maxWidthHeight = params.maxWidthHeight;
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawTrim(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight"]});
    bindParams(params, function(key, target, rel) {
		     drawTrim(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["fuzz", "margin"]});
}

var worker = new workerProcess("worker/trim.js");

function drawTrim(srcCanvas, dstCanvas, params, sync) {
    var params_w = {
        fuzz  : params.fuzz,
        margin: params.margin,
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
