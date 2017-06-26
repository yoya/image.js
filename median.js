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
	    drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null, "filterWindowRange":"filterWindowText"},
		 function() {
		     filter = document.getElementById("filterSelect").value;
		     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow);
		 } );
}

var worker = null;

function drawMedianFilter(srcCanvas, dstCanvas, filter, filterWindow) {
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = srcWidth, dstHeight = srcHeight;
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    if (worker) {
        worker.terminate();
    }
    var div = loadingStart();
    worker = new Worker("worker/median.js");
    worker.onmessage = function(e) {
	var [dstImageData] = [e.data.image];
	var dstWidth = dstImageData.width;
        var dstHeight = dstImageData.height;
        dstCtx.putImageData(dstImageData, 0, 0, 0, 0, dstWidth, dstHeight);
	loadingEnd(div);
        worker = null;
    }
    worker.postMessage({image:srcImageData, filter:filter,
			filterWindow:filterWindow},
                       [srcImageData.data.buffer]);
}
