"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var gammaCanvas = document.getElementById("gammaCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var gammaRange = document.getElementById("gammaRange");
    var gammaText = document.getElementById("gammaText");
    var gammaReciprocalRange = document.getElementById("gammaReciprocalRange");
    var gammaReciprocalText = document.getElementById("gammaReciprocalText");
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "gammaRange":"gammaText",
		  "gammaReciprocalRange":"gammaReciprocalText"},
		 function(target, rel) {
		     console.debug(target.id);
		     if ((target.id === "gammaRange") || (target.id === "gammaText")) {
			 gammaReciprocalRange.value = 1.0 / parseFloat(gammaRange.value);
			 gammaReciprocalText.value = gammaReciprocalRange.value;
		     } else if ((target.id === "gammaReciprocalRange") || (target.id === "gammaReciprocalText")) {
			 gammaRange.value = 1.0 / parseFloat(gammaReciprocalRange.value);
			 gammaText.value = gammaRange.value;
		     }
		     drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, rel);
		 } );
    gammaReciprocalRange.value = 1.0 / parseFloat(gammaRange.value);
    gammaReciprocalText.value = gammaReciprocalRange.value;
    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
}

function drawSrcImageAndGamma(srcImage, srcCanvas, dstCancas, gammaCanvas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var gamma = parseFloat(document.getElementById("gammaRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGammaGraph(gammaCanvas, gamma);
    drawGammaImage(srcCanvas, dstCanvas, gamma, sync);
}

function drawGammaGraph(gammaCanvas, gamma) {
    var ctx = gammaCanvas.getContext("2d");
    ctx.fillStyle="black";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.moveTo(256, 0)
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    for (var x = 0 ; x < 256 ; x++) {
	var v1 = x / 255;
    	var v2 = Math.pow(v1, gamma);
	var y = (1 - v2) * 255;
	ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

var worker = new workerProcess("worker/gamma.js");

function drawGammaImage(srcCanvas, dstCanvas, gamma, sync) {
    // console.debug("drawGammaImage");
    var params = {gamma:gamma};
    worker.process(srcCanvas, dstCanvas, params, sync);
}
