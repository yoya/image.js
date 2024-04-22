"use strict";
/*
 * 2024/04/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas"),
          spectrumCanvas = document.getElementById("spectrumCanvas"),
          dstCanvas = document.getElementById("dstCanvas");
    const canvases = { srcCanvas, spectrumCanvas, dstCanvas };
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
            drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
            drawSpectrumCanvas(canvases, params);
            drawSpectrumFilter(canvases, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeight":"maxWidthHeightText"},
		 function() {
                     drawSpectrumCanvas(canvases, params);
                     drawSpectrumFilter(canvases, params);
		 }, params );
    bindFunction({"contrast":"contrastText"},
		 function() {
                     drawSpectrumFilter(canvases, params);
		 }, params );
}

const gray = [0.5, 0.5, 0.5];
const colorPoints = [
    // corners
    [-0.2, -0.2, gray], [-0.2, 1.2, gray],
    [1.2, -0.2, gray], [1.2, 1.2, gray],
    [0.5, 0.5, [1.0, 0.2, 0.2]],   // center: red
    [0.5, 0.0, [0.5, 1.0, 0.3]],  // up: green
    [1.0, 0.5, [0.2, 0.3, 1.0]],  // right:  blue
    [0.5, 1.0, [0.9, 0.3, 1.0]],  // bottom: magenta
    [0.0, 0.5, [1.0, 0.9, 0.2]],  // left: yellow
];
function detectColor(x, y, w, h) {
    let color = null;
    let minDistance = (w * h) * (w * h);
    for (const cp of colorPoints) {
        const [px, py, pc] = cp;
        const dist = (x - px*w)**2 + (y - py*h)**2;
        if (dist < minDistance) {
            minDistance = dist;
            color = pc;
        }
    }
    return color;
}

function drawSpectrumCanvas(canvases, params) {
    // console.debug("drawSpectrumFilter");
    const { srcCanvas, spectrumCanvas } = canvases;
    const { width, height } = srcCanvas;
    spectrumCanvas.width  = width;
    spectrumCanvas.height = height;
    //
    const spectrumCtx = spectrumCanvas.getContext("2d");
    //
    let spectrumImageData = spectrumCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            let filter = detectColor(x, y, width, height);
            let [fr, fg, fb] = filter;
            setRGBA(spectrumImageData, x, y, [fr*255, fg*255, fb*255, 255]);
        }
    }
    const _windowSize = (width + height) / 4;
    const windowSize = ((_windowSize / 2) | 0) * 2 + 1;
    const kernel = makeKernel_Mean_1D(windowSize);
    spectrumImageData = convolveImage(spectrumImageData, kernel);
    spectrumCtx.putImageData(spectrumImageData, 0, 0);
}

function drawSpectrumFilter(canvases, params) {
    // console.debug("drawSpectrumFilter");
    const { srcCanvas, spectrumCanvas, dstCanvas } = canvases;
    const { contrast } = params;
    const { width, height } = srcCanvas;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcCtx = srcCanvas.getContext("2d");
    const spectrumCtx = spectrumCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const spectrumImageData = spectrumCtx.getImageData(0, 0, width, height);
    let dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            const [r, g, b, a] = getRGBA(srcImageData, x, y);
            const [fr, fg, fb] = getRGBA(spectrumImageData, x, y);
	    setRGBA(dstImageData, x, y, [r*fr/255*contrast,
                                         g*fg/255*contrast,
                                         b*fb/255*contrast, a]);
        }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
