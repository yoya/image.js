"use strict";
/*
 * 2020/06/12- (c) yoya@awm.jp
 * ref) https://qiita.com/Cartelet/items/5c1c012c132be3aa9608
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var varCanvas = document.getElementById("varCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var dstCanvases = [varCanvas, dstCanvas];
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            let maxWidthHeight = params["maxWidthHeightRange"];
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawKuwaharaFilter(srcCanvas, dstCanvases, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"variWindowRange":"variWindowText",
                  "vslideWindowRange":"vslideWindowText",
                  "filterWindowRange":"filterWindowText"},
		 function(target, rel) {
		     drawKuwaharaFilter(srcCanvas, dstCanvases, params, rel);
		 }, params);
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function(target, rel) {
		     let maxWidthHeight = params["maxWidthHeightRange"];
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawKuwaharaFilter(srcCanvas, dstCanvases, params, rel);
		 }, params);
}

var worker = new workerProcess("worker/kuwahara.js");

function drawKuwaharaFilter(srcCanvas, dstCanvases, params, sync) {
    var params_w = {
        rankOrder   : 1,
        variWindow  : params["variWindowRange"],
        vslideWindow: params["vslideWindowRange"],
        filterWindow: params["filterWindowRange"],
    };
    // console.debug("worker.process", srcCanvas, dstCanvases, params_w, sync);
    worker.process(srcCanvas, dstCanvases, params_w, sync);
}
