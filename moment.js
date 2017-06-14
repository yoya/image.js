"use strict";
/*
 * 2017/06/15- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndMoment(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "reverseCheckbox":null},
		 function() {
		     drawSrcImageAndMoment(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndMoment(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    var reverse = document.getElementById("reverseCheckbox").checked;
    drawGrayImage(srcCanvas, dstCanvas);
    drawMoment(dstCanvas, reverse);
}

function calcMoment(canvas, reverse) {
    var width = canvas.width, height = canvas.height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    var M00 = 0, M10 = 0, M01 = 0;
    for (var y = 0 ; y < height ; y++) {
	for (var x = 0 ; x < width ; x++) {
	    var [v] = getRGBA(imageData, x, y);
	    if (reverse) {
		v = 255 - v;
	    }
	    M00 += v;
	    M10 += x * v;
	    M01 += y * v;
	}
    }
    return [ M00, M10, M01 ];
}

function drawMoment(canvas, reverse) {
    // console.debug("drawMoment");
    var ctx = canvas.getContext("2d");
    var M00Text = document.getElementById("M00Text");
    var M10Text = document.getElementById("M10Text");
    var M01Text = document.getElementById("M01Text");
    var width = canvas.width, height = canvas.height;
    //
    var [ M00, M10, M01 ] = calcMoment(canvas, reverse);
    // console.debug([ M00, M10, M01 ]);
    M00Text.value = M00;
    M10Text.value = M10;
    M01Text.value = M01;
    var [cgX, cgY] = [M10 / M00, M01 / M00];
    // console.debug([ cgX, cgY ]);
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.strokeStyle = "orange";
    ctx.arc(cgX, cgY, 10, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}
