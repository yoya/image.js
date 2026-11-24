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
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, elem, rel) {
        if (key === "gamma") {
            params.gammaReciprocal = 1.0 / params.gamma;
            syncParamsToElements(params, {keys: ["gammaReciprocal"]});
        } else if (key === "gammaReciprocal") {
            params.gamma = 1.0 / params.gammaReciprocal;
            syncParamsToElements(params, {keys: ["gamma"]});
        }
        drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, rel);
    });
    params.gammaReciprocal = 1.0 / params.gamma;
    syncParamsToElements(params, {keys: ["gammaReciprocal"]});
    drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, true);
}

function drawSrcImageAndGamma(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, sync) {
    const { maxWidthHeight, gamma, R, G, B } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGammaGraph(gammaCanvas, gamma, [R, G, B]);
    var workerParams = {
        RGamma: R?gamma:1.0,
        GGamma: G?gamma:1.0,
        BGamma: B?gamma:1.0
    };
    drawGammaImage(srcCanvas, dstCanvas, workerParams, sync);
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
