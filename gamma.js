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
		  "gammaReciprocalRange":"gammaReciprocalText",
                  "RCheckbox":null, "GCheckbox":null, "BCheckbox":null},
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
    var R = document.getElementById("RCheckbox").checked;
    var G = document.getElementById("GCheckbox").checked;
    var B = document.getElementById("BCheckbox").checked;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGammaGraph(gammaCanvas, gamma, [R, G, B]);
    var params = {
        RGamma: R?gamma:1.0,
        GGamma: G?gamma:1.0,
        BGamma: B?gamma:1.0
    };
    drawGammaImage(srcCanvas, dstCanvas, params, sync);
}

function drawGammaGraph(canvas, gamma, RGBchecked) {
    let ctx = canvas.getContext("2d");
    let caption = "";
    drawCurveGraphBase(canvas, caption);
    ctx.globalCompositeOperation = "lighter";
    for (let i in RGBchecked) {
        let checked = RGBchecked[i];
        let data = {Count: 1, Gamma: (checked? gamma: 1.0)};
        let color = ["#F00", "#0F0", "#00F"][i];
        drawCurveGraphLine(canvas, data, color)
    }
}

var worker = new workerProcess("worker/gamma.js");

function drawGammaImage(srcCanvas, dstCanvas,params, sync) {
    // console.debug("drawGammaImage");
    worker.process(srcCanvas, dstCanvas, params, sync);
}
