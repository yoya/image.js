"use strict";
/*
 * 2017/04/23- (c) yoya@awm.jp
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
	    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     // console.debug(target.id);
		     switch (key) {
		     case "a":
		     case "b":
			 params.z = 0;
			 syncParamsToElements(params, {keys: ["z"]});
			 break;
		     case "z":
			 // -1.0
			 var z = params.z;
			 params.a = Math.abs(z) * 50;
			 params.b = z + 0.5;
			 syncParamsToElements(params, {keys: ["a", "b"]});
			 break;
		     }
		     drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, rel);
		 }, {keys: ["maxWidthHeight", "a", "b", "z", "linear"]});
    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, true);
}

function drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, params, sync) {
    var { maxWidthHeight, a, b, linear } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSigmoidGraph(gammaCanvas, a, b);
    drawSigmoidImage(srcCanvas, dstCanvas, a, b, linear, sync);
}

function drawSigmoidGraph(gammaCanvas, a, b) {
    var ctx = gammaCanvas.getContext("2d");
    ctx.fillStyle="black";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle="white";
    ctx.beginPath();
    ctx.moveTo(256, 0)
    ctx.lineTo(256, 256);
    ctx.lineTo(0, 256);
    var sig0 = sigmoid(0, a, b);
    var sig1 = sigmoid(1, a, b);
    for (var x = 0 ; x < 256 ; x++) {
	var v1 = x / 255;
	var v2 = (sigmoid(v1, a, b) - sig0) / (sig1 - sig0);
	var y = (1 - v2) * 255;
	ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

var worker = new workerProcess("worker/sigmoid.js");

function drawSigmoidImage(srcCanvas, dstCanvas, a, b, linear, sync) {
    // console.debug("drawSigmoidImage");
    var params = { a:a, b:b, linear:linear };
    worker.process(srcCanvas, dstCanvas, params, sync);
}
