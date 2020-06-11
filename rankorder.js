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
    // var filterSelect      = document.getElementById("filterSelect");
    // var filterWindowRange = document.getElementById("filterWindowRange");
    var rankOrderRange = document.getElementById("rankOrderRange");
    var rankOrderText  = document.getElementById("rankOrderText");
    // var maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    // var filterWindow   = parseFloat(filterWindowRange.value);
    // var rankOrder      = parseFloat(rankOrderRange.value)
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    dstCanvas.width = srcCanvas.width;
	    dstCanvas.height = srcCanvas.height;
	    drawRankOrderFilter(srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"filterSelect":null,
                  "filterWindowRange":"filterWindowText",
                  "rankOrderRange":"rankOrderText"},
		 function(target, rel) {
                     let filterWindow = params["filterWindowRange"];
                     let rankOrder    = params["rankOrderRange"];
                     if ((target.id == "filterSelect") || (target.id == "filterWindowRange") ||
                         (target.id == "filterWindowText")) {
                         var filter = params["filterSelect"];
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
                         rankOrderRange.value = rankOrder;
                         rankOrderText.value  = rankOrder;
                         params["rankOrderRange"] = rankOrder;
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
		     drawRankOrderFilter(srcCanvas, dstCanvas, params, rel);
		 }, params);
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     dstCanvas.width = srcCanvas.width;
		     dstCanvas.height = srcCanvas.height;
		     drawRankOrderFilter(srcCanvas, dstCanvas, params, rel);
		 }, params);
}

var worker = new workerProcess("worker/rankorder.js");

function drawRankOrderFilter(srcCanvas, dstCanvas, params, sync) {
    var params_w = {
        rankOrder   : params["rankOrderRange"],
        filterWindow: params["filterWindowRange"],
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}
