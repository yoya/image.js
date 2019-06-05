"use strict";
/*
 * 2019/06/06- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var maxWidthHeight    = document.getElementById("maxWidthHeightRange");
    var filterSelect      = document.getElementById("filterSelect");
    var filterWindowRange = document.getElementById("filterWindowRange");
    var rankOrderRange    = document.getElementById("rankOrderRange");
    var maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    var filterWindow   = parseFloat(filterWindowRange.value);
    var rankOrder      = parseFloat(rankOrderRange.value)
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawRankOrderFilter(srcCanvas, dstCanvas, rankOrder, filterWindow, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null,
                  "filterWindowRange":"filterWindowText",
                  "rankOrderRange":"rankOrderText"},
		 function(target, rel) {
                     filterWindow = parseFloat(document.getElementById("filterWindowRange").value);
                     rankOrderRange.max = filterWindow*filterWindow;
                     rankOrder = parseFloat(rankOrderRange.value);
                     if ((target.id == "filterSelect") || (target.id == "filterWindowRange") ||
                         (target.id == "filterWindowText")) {
                         var filter = filterSelect.value;
                         switch (filter) {
                         case "min":
                             rankOrder = 1;
                             break;
                         case "max":
                             rankOrder = filterWindow*filterWindow
                             break;
                         case "median":
                             rankOrder = (filterWindow*filterWindow/2+1) | 0;
                             break;
                         }
                         rankOrderRange.value = rankOrder;
                         rankOrderText.value  = rankOrder;
                     }
                     console.log(rankOrder, filterWindow, ((filterWindow*filterWindow/2) | 0));
                     if (rankOrder == 1) {
                         filterSelect.value = "min";
                     } else if (rankOrder == filterWindow*filterWindow) {
                         filterSelect.value = "max";
                     } else if (rankOrder == ((filterWindow*filterWindow/2+1) | 0)) {
                         filterSelect.value = "median";
                     } else {
                         filterSelect.value = "etc";
                     }
		     drawRankOrderFilter(srcCanvas, dstCanvas, rankOrder, filterWindow, rel);
		 } );
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawRankOrderFilter(srcCanvas, dstCanvas, rankOrder, filterWindow, rel);
		 } );
}

var worker = new workerProcess("worker/rankorder.js");

function drawRankOrderFilter(srcCanvas, dstCanvas, rankOrder, filterWindow, sync) {
    var params = {rankOrder:rankOrder, filterWindow:filterWindow};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
