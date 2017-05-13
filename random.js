"use strict";
/*
 * 2017/05/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    var histCanvas = document.getElementById("histCanvas");
    bindFunction({"refreshButton":null,
		  "widthRange":"widthText",
		  "heightRange":"heightText",
		  "redRatioRange":"redRatioText",
		  "greenRatioRange":"greenRatioText",
		  "blueRatioRange":"blueRatioText"},
		 function() {
		     drawRandomAndHistogram(canvas, histCanvas);
		 } );
    drawRandomAndHistogram(canvas, histCanvas);
}

function drawRandomAndHistogram(canvas, histCanvas) {
    var width = parseInt(document.getElementById("widthRange").value, 10);
    var height = parseInt(document.getElementById("heightRange").value, 10);
    var redRatio = parseFloat(document.getElementById("redRatioRange").value);
    var greenRatio = parseFloat(document.getElementById("greenRatioRange").value);
    var blueRatio = parseFloat(document.getElementById("blueRatioRange").value);
    drawRandom(canvas, width, height, redRatio, greenRatio, blueRatio);
    var redHist   = getColorHistogramList(canvas, "red");
    var greenHist = getColorHistogramList(canvas, "green");
    var blueHist  = getColorHistogramList(canvas, "blue");
    drawHistgramGraph(histCanvas, redHist, greenHist, blueHist, 0, 255, false);
}

function randomRGBA(redRatio, greenRatio, blueRatio) {
    var r = Math.random();
    var g = Math.random();
    var b = Math.random();
    r = Math.sqrt(r);
    g = Math.sqrt(g);
    b = Math.sqrt(b);
    if (redRatio < Math.random()) {
	r = 1 - r;
    }
    if (greenRatio < Math.random()) {
	g = 1 - g;
    }
    if (blueRatio < Math.random()) {
	b = 1 - b;
    }
    return [Math.floor(r * 256),
	    Math.floor(g * 256),
	    Math.floor(b * 256), 255 ];
}

function drawRandom(canvas, width, height, redRatio, greenRatio, blueRatio) {
    // console.debug("drawRandom");
    var ctx = canvas.getContext("2d");
    canvas.width  = width;
    canvas.height = height;
    //
    var imageData = ctx.createImageData(width, height);
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var rgba = randomRGBA(redRatio, greenRatio, blueRatio);
	    setRGBA(imageData, x, y, rgba);
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
