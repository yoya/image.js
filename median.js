"use strict";
/*
 * 2017/04/16- (c) yoya@awm.jp
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
	    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawMedianFilter(srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawMedianFilter(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["filter", "filterWindow"]});
    bindParams(params, function(key, target, rel) {
		     drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMedianFilter(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight"]});
}

var worker = new workerProcess("worker/median.js");

function drawMedianFilter(srcCanvas, dstCanvas, params, sync) {
    var params_w = {filter:params.filter, filterWindow:params.filterWindow};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
