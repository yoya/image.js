"use strict";
/*
 * 2021/09/07- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "rgRange":"rgText", "ybRange":"ybText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawRGYB(srcCanvas, dstCanvas, params);
}

function convertRGYB(rgba, rg, yb) {
    let [r, g, b, a] = rgba;
    if (rg < 0) { // red boost
        const ratio = - rg / 100;
        r = 255 * ratio + r * (1 - ratio);        
    } else { // green boost
        const ratio = rg / 100;
        g = 255 * ratio + g * (1 - ratio);
    }
    if (yb < 0) { // yellow boost
        const ratio = - yb / 100;
        r = 255 * ratio + r * (1 - ratio);
        g = 255 * ratio + g * (1 - ratio);
    } else { // blue boost
        const ratio = yb / 100;
        b = 255 * ratio + b * (1 - ratio);
    }
    
    return [r, g, b, a];
}

function drawRGYB(srcCanvas, dstCanvas, params) {
    // console.debug("drawRGYB");
    const rg = params.rgRange;
    const yb = params.ybRange;
    console.log("rg, yb", rg, yb);
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
            const rgba2 = convertRGYB(rgba, rg, yb);
	    setRGBA(dstImageData, x, y, rgba2);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
