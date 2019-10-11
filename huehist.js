"use strict";
/*
 * 2019/10/11- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var histCanvas = document.getElementById("histCanvas");
    var maxWidthHeightRange = document.getElementById("maxWidthHeightRange");
    var maxRatioRange = document.getElementById("maxRatioRange");
    //
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var maxWidthHeight = parseFloat(maxWidthHeightRange.value);
    var maxRatio = maxRatioRange.value;
    var hist = [];
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
            hist = getHueHistogram(srcCanvas);
            drawHueHistogram(histCanvas, hist, maxRatio);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
                     maxWidthHeight = parseFloat(maxWidthHeightRange.value);
                     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
                     hist = getHueHistogram(srcCanvas);
                     drawHueHistogram(histCanvas, hist, maxRatio);
		 } );
    bindFunction({"maxRatioRange":"maxRatioText"},
		 function() {
                     maxRatio = maxRatioRange.value;
                     drawHueHistogram(histCanvas, hist, maxRatio);
		 } );
}

function getHueHistogram(canvas) {
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var length = data.length;
    var hist = new Float32Array(360);
    for (var i = 0 ; i < length ; i+=4) {
        var rgba = data.slice(i, i+4);
        if (rgba[3] > 0) { // alpha check
            var [h, s, v] = RGB2HSV(rgba);
            hist[h] += s;
        }
    }
    return hist;
}

function drawHueHistogram(canvas, hist, maxRatio) {
    // console.debug("drawHueHistogram");
    canvas.style.backgroundColor = "black";
    var ctx = canvas.getContext("2d");
    var width  = histCanvas.width, height = histCanvas.height;
    histCanvas.width = width; // clear
    var max = 0;
    for (var i = 0 ; i < 360 ; i++) {
        var h = hist[i];
        if (max < h) {
            max = h;
        }
    }
    max *= maxRatio;
    ctx.lineWidth = 1;
    for (var i = 0 ; i < width; i++) {
        var x = i + 0.5;
        var y = height * (1 - (hist[i] / max));
        ctx.strokeStyle = "hsl("+i+", 100%, 50%)";
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}
