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
    var params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params.maxWidthHeight;
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawRankOrderFilter(srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
                     let filterWindow = params.filterWindow;
                     let rankOrder    = params.rankOrder;
                     if ((key == "filter") || (key == "filterWindow")) {
                         var filter = params.filter;
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
                         default:
                             if (rankOrder > filterWindow*filterWindow) {
                                 rankOrder = filterWindow*filterWindow;
                             }
                             break;
                         }
                         params.rankOrder = rankOrder;
                         syncParamsToElements(params, {keys: ["rankOrder"]});
                     }
                     console.log(rankOrder, filterWindow, ((filterWindow*filterWindow/2) | 0));
                     if (rankOrder == 1) {
                         params.filter = "min";
                     } else if (rankOrder == filterWindow*filterWindow) {
                         params.filter = "max";
                     } else if (rankOrder == ((filterWindow*filterWindow/2+1) | 0)) {
                         params.filter = "median";
                     } else {
                         params.filter = "etc";
                     }
                     syncParamsToElements(params, {keys: ["filter"]});
		     drawRankOrderFilter(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["filter", "filterWindow", "rankOrder"]});
    bindParams(params, function(key, target, rel) {
		     let maxWidthHeight = params.maxWidthHeight;
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawRankOrderFilter(srcCanvas, dstCanvas, params, rel);
		 }, {keys: ["maxWidthHeight"]});
}

var worker = new workerProcess("worker/rankorder.js");

function drawRankOrderFilter(srcCanvas, dstCanvas, params, sync) {
    var params_w = {
        rankOrder   : params.rankOrder,
        filterWindow: params.filterWindow,
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
