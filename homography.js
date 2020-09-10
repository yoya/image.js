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
    let markerCheckbox = document.getElementById("markerCheckbox");
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
                  "markerCheckbox":null,
                  "aRange":"aText", "bRange":"bText", "cRange":"cText",
                  "dRange":"dText", "eRange":"eText", "fRange":"fText",
                  "gRange":"gText", "hRange":"hText"},
		 function(target, rel) {
                     params["maxWidthHeight"] = parseFloat(maxWidthHeightRange.value);
                     params["marker"] = markerCheckbox.checked;

                     let num = coeffNameNumber(target.id);
                     if (num >= 0) {
                         params.coeff[num] = parseFloat(target.value);
                     }
                     drawHomograpy(srcImage, srcCanvas, dstCanvas, params, rel);
		 } );
}

var worker = new workerProcess("worker/homography.js");

function drawHomograpy(srcImage, srcCanvas, dstCanvas, params, sync) {
    drawSrcImage(srcImage, srcCanvas, params["maxWidthHeight"]);
    //
    worker.process(srcCanvas, dstCanvas, params, sync);
    worker.addListener(function() {
        if (params.marker) {
            drawMarker(srcCanvas, params.coeff);
        }
    });
}

function drawMarker(canvas, coeff) {
    let ctx = canvas.getContext("2d");
    let width = canvas.width, height = canvas.height;
    let xyArr = [
        homography(0.0, 0.0, coeff), homography(1.0, 0.0, coeff),
        homography(1.0, 1.0, coeff), homography(0.0, 1.0, coeff),
    ];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        xyArr[i] = [x * width, y * height];
    }
    ctx.beginPath();
    ctx.moveTo(xyArr[3][0],xyArr[3][1]);
    let colors = [["red"], "yellow", "green", "blue"];
    for (let i = 0, n = xyArr.length; i < n; i++) {
        let [x, y] = xyArr[i];
        ctx.strokeStyle = colors[(i+3)%4];
        ctx.lineTo(x, y)
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = colors[i];
        ctx.fillStyle = "white";
        ctx.arc(x, y, 6, 0, 2*Math.PI, false);
        ctx.stroke();
        ctx.fill();
        ctx.moveTo(x, y);
    }
}

