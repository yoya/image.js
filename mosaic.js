"use strict";
/*
 * 2017/06/22- (c) yoya@awm.jp
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
	    let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMosaic(srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, params, rel);
		 }, params);
    bindFunction({"blockSizeRange":"blockSizeText",
		  "blockTypeSelect":null},
		 function(target, rel) {
		     drawMosaic(srcCanvas, dstCanvas, params, rel);
		 }, params);
}

var worker = new workerProcess("worker/mosaic.js");

function drawMosaic(srcCanvas, dstCanvas, params, sync) {
    let params_w = {
        blockSize: params["blockSizeRange"],
        blockType: params["blockTypeSelect"],
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
