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
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var filter = document.getElementById("filterSelect").value;
    var filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null, "filterWindowRange":"filterWindowText"},
		 function(target, rel) {
		     filter = document.getElementById("filterSelect").value;
		     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, rel);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, rel);
		 } );
}

var worker = new workerProcess("worker/median.js");

function drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow, sync) {
    var params = {filter:filter, filterWindow:filterWindow};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
