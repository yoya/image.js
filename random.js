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
		  "animationButton":null,
		  "widthRange":"widthText",
		  "heightRange":"heightText",
		  "redRatioRange":"redRatioText",
		  "greenRatioRange":"greenRatioText",
		  "blueRatioRange":"blueRatioText"},
		 function(target) {
		     if (target.id === "animationButton") {
			 animetionRandomAndHistogram(canvas, histCanvas);
		     }
		     drawRandomAndHistogram(canvas, histCanvas);
		     
		 } );
    drawRandomAndHistogram(canvas, histCanvas);
}

var anim_id = null;
function animetionRandomAndHistogram(canvas, histCanvas) {
    var Context = function() {
	this.canvas = canvas;
	this.histCanvas =  histCanvas;
    }
    var ctx = new Context();
    if (anim_id === null) {
	anim_id = setInterval(animetionRandomAndHistogram_.bind(ctx), 10);
    } else {
	clearInterval(anim_id);
	anim_id = null;
    }
}

function animetionRandomAndHistogram_() {
    var canvas = this.canvas;
    var histCanvas = this.histCanvas
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

function randomValue(ratio) {
    var v = Math.random();       // 0   <= v < 1
    var r = Math.random() - 0.5; // 0.5 <= r < 0.5
    v = Math.sqrt(v);
    if (ratio < r) {
	v = 1 - v;
    }
    if (ratio < -0.5) {
	v = v * (ratio + 1.5) ;
    } else if (ratio > 0.5) {
	v = v * (1.5 - ratio) + (ratio - 0.5);
    }
    return v;
}

function randomRGBA(redRatio, greenRatio, blueRatio) {
    var r = randomValue(redRatio);
    var g = randomValue(greenRatio);
    var b = randomValue(blueRatio);
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
