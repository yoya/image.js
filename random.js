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
    var image = new Image(canvas.width, canvas.height);
    var offCanvas = null;
    var histCanvas = document.getElementById("histCanvas");
    var widthRange = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
        dropFunction(document, function(dataURL) {
	    image = new Image();
	    image.onload = function() {
		offCanvas = document.createElement("canvas");
		offCanvas.id = "offCanvas";
		drawSrcImage(image, offCanvas, maxWidthHeight);
		var width = parseFloat(offCanvas.width);
		var height = parseFloat(offCanvas.height);
		widthRange.value = widthText.value = width;
		heightRange.value = heightText.value = height;
		drawRandomAndHistogram(canvas, offCanvas, histCanvas);
	    }
	    image.src = dataURL;
	}, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(image, offCanvas, maxWidthHeight);
		     var width = parseFloat(offCanvas.width);
		     var height = parseFloat(offCanvas.height);
		     widthRange.value = widthText.value = width;
		     heightRange.value = heightText.value = height;
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas);
		 } );
    bindFunction({"refreshButton":null,
		  "animationButton":null,
		  "ejectButton":null,
		  "widthRange":"widthText",
		  "heightRange":"heightText",
		  "redRatioRange":"redRatioText",
		  "greenRatioRange":"greenRatioText",
		  "blueRatioRange":"blueRatioText",
		  "ampRange":"ampText",
		  "densityRange":"densityText"},
		 function(target) {
		     if (target.id === "ejectButton") {
			 offCanvas = null;
		     }
		     if (target.id === "animationButton") {
			 animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
		     }
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas);
		     
		 } );
    drawRandomAndHistogram(canvas, offCanvas, histCanvas);
}

var anim_id = null;
function animetionRandomAndHistogram(canvas, offCanvas, histCanvas) {
    var Context = function() {
	this.canvas = canvas;
	this.offCanvas = offCanvas;
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
    var offCanvas = this.offCanvas;
    var histCanvas = this.histCanvas
    drawRandomAndHistogram(canvas, offCanvas, histCanvas);
}

function drawRandomAndHistogram(canvas, offCanvas, histCanvas) {
    if (anim_id !== null) {
	animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
	animetionRandomAndHistogram(canvas, offCanvas, histCanvas);
    }
    var width = parseInt(document.getElementById("widthRange").value, 10);
    var height = parseInt(document.getElementById("heightRange").value, 10);
    var redRatio = parseFloat(document.getElementById("redRatioRange").value);
    var greenRatio = parseFloat(document.getElementById("greenRatioRange").value);
    var blueRatio = parseFloat(document.getElementById("blueRatioRange").value);
    var amp = parseFloat(document.getElementById("ampRange").value);
    var density = parseFloat(document.getElementById("densityRange").value);
    drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, density);
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

function drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, density) {
    // console.debug("drawRandom");
    var ctx = canvas.getContext("2d");
    canvas.width  = width;
    canvas.height = height;
    //
    var imageData = ctx.createImageData(width, height);
    if (offCanvas === null) {
	for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
		if (Math.random() < 1/density) {
		    var [r,g,b] = randomRGBA(redRatio, greenRatio, blueRatio);
		    var rgba = [ amp * r,  amp * g, amp * b, 255];
		    setRGBA(imageData, x, y, rgba);
		}
	    }
	}
    } else {
	var offCtx = offCanvas.getContext("2d");
	var offImageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
	for (var y = 0 ; y < height; y++) {
            for (var x = 0 ; x < width; x++) {
		if (Math.random() < 1/density) {
		    var [r1,g1,b1,a1] = getRGBA(offImageData, x, y, "edge");
		    var [r2,g2,b2] = randomRGBA(redRatio, greenRatio, blueRatio);
		    var rgba = [ r1 + amp*2*(r2 - 127),  g1 + amp*2*(g2 - 127), b1 + amp*2*(b2 - 127), a1];
		} else {
		    var rgba = getRGBA(offImageData, x, y, "edge");
		}
		setRGBA(imageData, x, y, rgba);
	    }
	}
    }
    ctx.putImageData(imageData, 0, 0);
}
