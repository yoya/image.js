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
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "aRange":"aText", "bRange":"bText",
		  "linearCheckbox":null},
		 function(target, rel) {
		     // console.debug(target.id);
		     drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, rel);
		 } );
    drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCanvas, gammaCanvas, true);
}

function drawSrcImageAndSigmoid(srcImage, srcCanvas, dstCancas, gammaCanvas, sync) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var a = parseFloat(document.getElementById("aRange").value);
    var b = parseFloat(document.getElementById("bRange").value);
    var linear = document.getElementById("linearCheckbox").checked;
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
