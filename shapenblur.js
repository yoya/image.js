"use strict";
/*
 * 2021/10/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSharpenBlur(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "amountRange":"amountText",
                  "linearGammaCheckbox":null},
		 function() {
		     drawSrcImageAndSharpenBlur(srcImage, srcCanvas, dstCanvas,
                                                params);
		 }, params);
}

function drawSrcImageAndSharpenBlur(srcImage, srcCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSharpenBlur(srcCanvas, dstCanvas, params);
}

function filterKernel(srcLine, dstLine, n, kernel) {
    const kernelSize = kernel.length;
    const kernelOffset = (1 - kernelSize) / 2;
    for (let i = 0; i < n; i++) {
        let v = 0;
        for (let j = 0; j < kernelSize; j++) {
            let k = i + j + kernelOffset;
            if (k < 0) { k = 0; } else if (n <= k) { k = n - 1; }  // clamp
            v += srcLine[k] * kernel[j];
        }
        dstLine[i] = v;
    }
}

function convolutionFilter(srcImageData, dstImageData, kernel) {
    const width = dstImageData.width, height = dstImageData.height;
    const srcData = srcImageData.data, dstData = dstImageData.data;
    const lineSize = Math.max(width, height);
    const srcLineR = new (dstData.constructor)(lineSize);
    const srcLineG = srcLineR.slice(0);  // clone
    const srcLineB = srcLineR.slice(0);  // clone
    const srcLineA = srcLineR.slice(0);  // clone
    const dstLineR = srcLineR.slice(0);  // clone
    const dstLineG = srcLineR.slice(0);  // clone
    const dstLineB = srcLineR.slice(0);  // clone
    // horizontal convolution filter
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            let offset = 4 * (x + (y * width));
            srcLineR[x] = srcData[offset++];
            srcLineG[x] = srcData[offset++];
            srcLineB[x] = srcData[offset++];
            srcLineA[x] = srcData[offset];
        }
        filterKernel(srcLineR, dstLineR, width, kernel);
        filterKernel(srcLineG, dstLineG, width, kernel);
        filterKernel(srcLineB, dstLineB, width, kernel);
        for (let x = 0 ; x < width; x++) {
            let  offset = 4 * (x + (y * width));
            dstImageData.data[offset++] = dstLineR[x];
            dstImageData.data[offset++] = dstLineG[x];
            dstImageData.data[offset++] = dstLineB[x];
            dstImageData.data[offset]   = srcLineA[x];
        }
    }
    srcData.set(dstData, 0);
    // vertical convolution filter
    for (let x = 0 ; x < width; x++) {
        for (let y = 0 ; y < height; y++) {
            let offset = 4 * (x + (y * width));
            srcLineR[y] = srcData[offset++];
            srcLineG[y] = srcData[offset++];
            srcLineB[y] = srcData[offset++];
            srcLineA[y] = srcData[offset];
        }
        filterKernel(srcLineR, dstLineR, height, kernel);
        filterKernel(srcLineG, dstLineG, height, kernel);
        filterKernel(srcLineB, dstLineB, height, kernel);
        for (let y = 0 ; y < height; y++) {
            let  offset = 4 * (x + (y * width));
            dstImageData.data[offset++] = dstLineR[y];
            dstImageData.data[offset++] = dstLineG[y];
            dstImageData.data[offset++] = dstLineB[y];
            dstImageData.data[offset]   = srcLineA[y];
        }
    }
}

function drawSharpenBlur(srcCanvas, dstCanvas, params) {
    const amount = params.amountRange;
    const linearGamma = params.linearGammaCheckbox;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    let srcImageData = srcCtx.getImageData(0, 0, width, height);
    let dstImageData = dstCtx.createImageData(width, height);
    if (linearGamma) {
        srcImageData = transformImageDataToLinearRGB(srcImageData);
    }
    if (amount != 0) {  // sharpen or blur
        let s = amount / 20;
        let kernel = (amount > 0)? Float32Array.from([ -s, 1 + (2*s), -s ])
            : pascalTriangle(-amount * 2 + 1);
        if (amount < 0) {  // blur
            const total = kernel.reduce((a, b) => a + b, 0);
            kernel = kernel.map(v => v / total);
        }
        convolutionFilter(srcImageData, dstImageData, kernel);
    } else {  // ident
        dstImageData.data.set(srcImageData.data);
    }
    if (linearGamma) {
        dstImageData = transformImageDataFromLinearRGB(dstImageData);
    }
    //
    dstCtx.putImageData(dstImageData, 0, 0);
}
