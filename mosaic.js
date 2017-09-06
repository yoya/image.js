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
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var blockSize = parseFloat(document.getElementById("blockSizeRange").value);
    var blockType = document.getElementById("blockTypeSelect").value;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
		 } );
    bindFunction({"blockSizeRange":"blockSizeText",
		  "blockTypeSelect":null},
		 function() {
		     blockSize = parseFloat(document.getElementById("blockSizeRange").value);
		     blockType = document.getElementById("blockTypeSelect").value;
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
		 } );
}

var worker = new workerProcess("worker/mosaic.js");

function drawMosaic(srcCanvas, dstCanvas, blockSize, blockType, sync) {
    var params = {blockSize:blockSize, blockType:blockType};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
