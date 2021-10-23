"use strict";
/*
 * 2019/10/11- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const histCanvas = document.getElementById("histCanvas");
    const histRingCanvas = document.getElementById("histRingCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let hist = [];
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            const maxWidthHeight = params.maxWidthHeightRange;
            const logHist = params.logHistCheckbox;
            const maxRatio = params.maxRatioRange;
            drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
            hist = getHueHistogram(srcCanvas, logHist);
            drawHueHistogram(histCanvas, histRingCanvas, hist, maxRatio);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "logHistCheckbox":null},
		 function() {
                     const maxWidthHeight = params.maxWidthHeightRange;
                     const logHist = params.logHistCheckbox;
                     const maxRatio = params.maxRatioRange;
                     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
                     hist = getHueHistogram(srcCanvas, logHist);
                     drawHueHistogram(histCanvas, histRingCanvas, hist, maxRatio);
		 }, params);
    bindFunction({"maxRatioRange":"maxRatioText"},
		 function() {
                     const maxRatio = params.maxRatioRange;
                     drawHueHistogram(histCanvas, histRingCanvas, hist, maxRatio);
		 }, params);
}

function getHueHistogram(canvas, logHist) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const length = data.length;
    let hist = new Float32Array(360);
    for (let i = 0 ; i < length ; i+=4) {
        const rgba = data.slice(i, i+4);
        const alpha = rgba[3];
        const [h, s, v] = RGB2HSV(rgba);
        hist[h] += s * v * alpha;
    }
    if (logHist) {
        hist = hist.map(v =>  Math.log(v));
    }
    return hist;
}

function drawHueHistogram(canvas, canvasRing, hist, maxRatio) {
    drawHistGraph(canvas, hist, maxRatio);
     drawHistRing(canvasRing, hist, maxRatio);
}

function drawHistGraph(canvas, hist, maxRatio) {
    // console.debug("drawHueHistogram");
    canvas.style.backgroundColor = "black";
    const ctx = canvas.getContext("2d");
    const width  = canvas.width, height = canvas.height;
    canvas.width = width; // clear
    const max = hist.reduce((a, b) => (a > b)? a: b ) * maxRatio;
    ctx.lineWidth = 1;
    for (let i = 0 ; i < 360 ; i++) {
        const x = i + 0.5;
        const y = height * (1 - (hist[i] / max));
        const [r, g, b] = HSV2RGB([i, 1.0, 1.0]);
        ctx.strokeStyle = "rgb("+r+","+g+","+b+")";
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function drawHistRing(canvas, hist, maxRatio) {
    canvas.style.backgroundColor = "black";
    const ctx = canvas.getContext("2d");
    const width  = canvas.width, height = canvas.height;
    const centerX = width / 2, centerY = height / 2;
    const radius = 50;
    canvas.width = width; // clear
    const max = hist.reduce((a, b) => (a > b)? a: b ) * maxRatio;
    ctx.lineWidth = 1;
    const rMax = Math.min(width, height) / 2;
    const rMin = radius;
    const delta = 2*Math.PI / 360;
    for (let i = 0 ; i < 360; i++) {
        const radius = (rMax - rMin) * (hist[i] / max) + rMin;
        const t = i * delta;
        const x = centerX + radius * Math.sin(t);
        const y = centerY - radius * Math.cos(t);
        const [r, g, b] = HSV2RGB([i, 1.0, 1.0]);
        ctx.strokeStyle = "rgb("+r+","+g+","+b+")";
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2*Math.PI);
    ctx.fill();
}
