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
    const mapCanvas = document.getElementById("mapCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let hist = [];
    let map = [];
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            const maxWidthHeight = params.maxWidthHeightRange;
            drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
            [hist, map] = getHueHistogram(srcCanvas, params);
            drawHueHistogram(histCanvas, histRingCanvas, mapCanvas,
                             hist, map, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "binHistRange":"binHistText",
                  "logHistCheckbox":null},
		 function() {
                     const maxWidthHeight = params.maxWidthHeightRange;
                     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
                     [hist, map] = getHueHistogram(srcCanvas, params);
                     drawHueHistogram(histCanvas, histRingCanvas, mapCanvas,
                                      hist, map, params);
		 }, params);
    bindFunction({"maxRatioRange":"maxRatioText"},
		 function() {
                     drawHueHistogram(histCanvas, histRingCanvas, mapCanvas,
                                      hist, map, params);
		 }, params);
}

function getHueHistogram(canvas, params) {
    const binHist = params.binHistRange;
    const logHist = params.logHistCheckbox;
    //
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const length = data.length;
    let hist = new Float32Array(360);
    let map = new Float32Array(360*101);  // hue-sarutation map
    for (let i = 0 ; i < length ; i+=4) {
        const rgba = data.slice(i, i+4);
        const alpha = rgba[3];
        const [h, s, l] = RGB2HSL(rgba);
        const hh = Math.round(h);
        hist[hh] += s * l * alpha;
        const ss = Math.round(s * 100);
        map[hh + (ss * 360)] += l * alpha;
    }
    if (binHist > 1) {
        for (let i = 0; i < 360; i+= binHist) {
            const sum = hist.subarray(i, i + binHist).reduce((a,b) => a+b);
            for (let j = i; j < i+binHist; j++) {
                hist[j] = sum / binHist;
            }
        }
    }
    if (logHist) {
        hist = hist.map(v =>  Math.log(v));
        map = map.map(v =>  Math.log(v));
    }
    return [hist, map];
}

function drawHueHistogram(canvas, canvasRing, mapCanvas, hist, map, params) {
    drawHistGraph(canvas, hist, params);
    drawHistRing(canvasRing, hist, params);1
    drawHueSaturationMap(mapCanvas, map, params);
}

function drawHistGraph(canvas, hist, params) {
    const maxRatio = params.maxRatioRange;
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
        const [r, g, b] = HSL2RGB([i, 1.0, 1.0]);
        ctx.strokeStyle = "rgb("+r+","+g+","+b+")";
        ctx.beginPath();
        ctx.moveTo(x, height);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}

function drawHistRing(canvas, hist, params) {
    const maxRatio = params.maxRatioRange;
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
        const [r, g, b] = HSL2RGB([i, 1.0, 1.0]);
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

function drawHueSaturationMap(canvas, map, params) {
    const maxRatio = params.maxRatioRange;
    canvas.style.backgroundColor = "black";
    const ctx = canvas.getContext("2d");
    const width  = canvas.width, height = canvas.height;
    canvas.width = width; // clear
    const max = map.reduce((a, b) => (a > b)? a: b ) * maxRatio;
    ctx.lineWidth = 1;
    for (let x = 0 ; x < 360 ; x++) {
        for (let y = 0 ; y < 101 ; y++) {
            const i = x  + y * 360;
            const h = x;
            const s = (100 - y) / 100;
            const l = map[i] / max;
            const [r, g, b] = HSL2RGB([h, s, (l<1.0)?l:1.0]);
            // console.log(x, y, [h, s, v], [r, g, b]);
            ctx.fillStyle = "rgb("+r+","+g+","+b+")";
            ctx.beginPath();
            ctx.rect(x, 2*y, x+1, 2*y+2);
            ctx.fill();
        }
    }
}
