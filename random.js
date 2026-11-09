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
    var params = {};
        dropFunction(document, function(dataURL) {
	    image = new Image();
	    image.onload = function() {
		offCanvas = document.createElement("canvas");
		offCanvas.id = "offCanvas";
		drawSrcImage(image, offCanvas, params.maxWidthHeight);
		params.width  = offCanvas.width;
		params.height = offCanvas.height;
		syncParamsToElements(params, {keys: ["width", "height"]});
		drawRandomAndHistogram(canvas, offCanvas, histCanvas, params);
	    }
	    image.src = dataURL;
	}, "DataURL");
    bindParams(params, function(key, target, rel) {
		     if (offCanvas) {  // no image before a drop or after Eject
			 drawSrcImage(image, offCanvas, params.maxWidthHeight);
			 params.width  = offCanvas.width;
			 params.height = offCanvas.height;
			 syncParamsToElements(params, {keys: ["width", "height"]});
		     }
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas, params);
		 }, {keys: ["maxWidthHeight"]});
    bindParams(params, function(key, target, rel) {
                     var { amp, offset } = params;
	             if (key === "amp") {
                         if (1 < (offset + amp)) {
                             params.offset = 1 - amp;
                             syncParamsToElements(params, {keys: ["offset"]});
                         }
                     }
                     if (key === "offset") {
                         if (1 < (offset + amp)) {
                             params.amp = 1 - offset;
                             syncParamsToElements(params, {keys: ["amp"]});
                         }
                     }
		     if (key === "ejectButton") {
			 offCanvas = null;
		     }
		     if (key === "animationButton") {
			 animationRandomAndHistogram(canvas, offCanvas, histCanvas, params);
		     }
		     drawRandomAndHistogram(canvas, offCanvas, histCanvas, params);
		     
		 }, {keys: ["refreshButton", "animationButton", "ejectButton", "width", "height", "redRatio", "greenRatio", "blueRatio", "amp", "offset", "density"]});
    drawRandomAndHistogram(canvas, offCanvas, histCanvas, params);
}

var anim_id = null;
function animationRandomAndHistogram(canvas, offCanvas, histCanvas, params) {
    var Context = function() {
	this.canvas = canvas;
	this.offCanvas = offCanvas;
	this.histCanvas =  histCanvas;
	this.params = params;
    }
    var ctx = new Context();
    if (anim_id === null) {
	anim_id = setInterval(animationRandomAndHistogram_.bind(ctx), 10);
    } else {
	clearInterval(anim_id);
	anim_id = null;
    }
}

function animationRandomAndHistogram_() {
    var canvas = this.canvas;
    var offCanvas = this.offCanvas;
    var histCanvas = this.histCanvas
    drawRandomAndHistogram(canvas, offCanvas, histCanvas, this.params);
}

function drawRandomAndHistogram(canvas, offCanvas, histCanvas, params) {
    if (anim_id !== null) {
	animationRandomAndHistogram(canvas, offCanvas, histCanvas, params);
	animationRandomAndHistogram(canvas, offCanvas, histCanvas, params);
    }
    var { width, height, redRatio, greenRatio, blueRatio, amp, offset, density } = params;
    drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, offset, density);
    var redHist   = getColorHistogramList(canvas, "red");
    var greenHist = getColorHistogramList(canvas, "green");
    var blueHist  = getColorHistogramList(canvas, "blue");
    drawHistgramGraph(histCanvas, redHist, greenHist, blueHist, 0, 255, false, true);
}

function randomValue(ratio) {
    var v = Math.random();       //  0.0 <= v < 1.0
    var r = Math.random() - 0.5; // -0.5 <= r < 0.5
    v = Math.sqrt(v);
    if (ratio < r) {
	v = 1 - v;
    }
    if (ratio < -0.5) {
        var ratio2 = (ratio+0.5)*2;
	v = v * (ratio2 + 1.0) ;
    } else if (0.5 < ratio) {
        var ratio2 = (ratio-0.5)*2;
	v = v * (1.0 - ratio2) + ratio2;
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

function drawRandom(canvas, offCanvas, width, height, redRatio, greenRatio, blueRatio, amp, offset, density) {
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
                    var o = offset * 255;
		    var rgba = [ o + amp * r,  o + amp * g, o + amp * b, 255];
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
