"use strict";
/*
 * 2018/12/12- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const { width, height } = srcCanvas;
    let srcImage = new Image(width, height);
    const params = {};
    dropFunction(document, function(dataURL) {
        srcImage = new Image();
	srcImage.onload = function() {
            const { width, height } = srcCanvas;
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeight":"maxWidthHeightText",
		  "thresholdMethod": null,
                  "maxLuminance":"maxLuminanceText",
                  "minLuminance":"minLuminanceText"},
		 function(target, rel) {
                     switch (target.id) {
                     case "maxLuminance":
                         if (params.maxLuminance <= params.minLuminance) {
                             const lumi = params.minLuminance + 1;
                             params.maxLuminance = lumi;
                             params.maxLuminanceText = lumi;
                             maxLuminance.value =  lumi;
                             maxLuminanceText.value =  lumi;
                         }
                         break;
                     case "minLuminance":
                         if (params.minLuminance >= params.maxLuminance) {
                             const lumi = params.maxLuminance - 1;
                             params.minLuminance = lumi;
                             params.minLuminanceText = lumi;
                             minLuminance.value = lumi;
                             minLuminanceText.value = lumi;
                         }
                     }
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, rel);
		 }, params);
 }
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
    drawLB(srcCanvas, dstCanvas, params, sync);
}


var worker = new workerProcess("worker/lb.js");

function drawLB(srcCanvas, dstCanvas, params, sync) {
    var _params = { params: params };
    worker.process(srcCanvas, dstCanvas, _params, sync);
}
