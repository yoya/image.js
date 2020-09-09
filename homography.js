"use strict";
/*
 * 2020/09/10- (c) yoya@awm.jp
 * ref) https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var coeffNameList = ["a", "b", "c", "d", "e", "f", "g", "h"];
function coeffNameNumber(name) {
    for (let i = 0, n = coeffNameList.length; i < n ; i++) {
        let cName = coeffNameList[i];
        if ((name === cName+"Range") || (name === cName+"Text")) {
            return i;
        }
    }
    return -1;
}

function main() {
    // console.debug("main");
    let srcCanvas = document.getElementById("srcCanvas");
    let dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let maxWidthHeightRange = document.getElementById("maxWidthHeightRange");
    var params = {
        maxWidthHeight: parseFloat(maxWidthHeightRange.value),
        coeff: [1, 0, 0,
                0, 1, 0,
                0, 0, 1]
    };
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            drawHomograpy(srcImage, srcCanvas, dstCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "aRange":"aText", "bRange":"bText", "cRange":"cText",
                  "dRange":"dText", "eRange":"eText", "fRange":"fText",
                  "gRange":"gText", "hRange":"hText"},
		 function(target, rel) {
                     if (target.id === "maxWidthHeightRange" ||
                         target.id === "maxWidthHeightText") {
                         params["maxWidthHeight"] = parseFloat(maxWidthHeightRange.value);
                     }
                     let num = coeffNameNumber(target.id);
                     if (num >= 0) {
                         params.coeff[num] = parseFloat(target.value);
                     }
                     drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
		 } );
}

var worker = new workerProcess("worker/homography.js");

function drawHomograpy(srcImage, srcCanvas, dstCanvas, params, sync) {
    var maxWidthHeight = params["maxWidthHeight"];
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    //
    var params_w = {
        coeff: params.coeff
    };
    worker.process(srcCanvas, dstCanvas, params_w, sync);
}

