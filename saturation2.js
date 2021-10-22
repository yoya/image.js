"use strict";
/*
 * 2021/10/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    let srcCanvas = document.getElementById("srcCanvas");
    let dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSaturation(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "saturationRange":"saturationText"},
		 function() {
		     drawSrcImageAndSaturation(srcImage, srcCanvas, dstCanvas, params);
		 }, params);
}
function drawSrcImageAndSaturation(srcImage, srcCanvas, dstCancas, params) {
    let maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSaturation(srcCanvas, dstCanvas, params);
}

// https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
function saturation2(rgba, s) {
    let [r, g, b, a] = rgba;
    let m = Math.max(rgba[0], rgba[1], rgba[2]);
    const amount = s;
    rgba[0] = r*(0.2126 + 0.7874 * amount) + g*(0.7152 - 0.7152  * amount) + b*(0.0722 - 0.0722 * amount);
    rgba[1] = r*(0.2126 - 0.2126 * amount) + g*(0.7152 + 0.2848  * amount) + b*(0.0722 - 0.0722 * amount);
    rgba[2] = r*(0.2126 - 0.2126 * amount) + g*(0.7152 - 0.7152  * amount) + b*(0.0722 + 0.9278 * amount);
    rgba[3] = a;
    return rgba;
}

function drawSaturation(srcCanvas, dstCanvas, params) {
    // console.debug("drawSaturation");
    let srcCtx = srcCanvas.getContext("2d");
    let dstCtx = dstCanvas.getContext("2d");
    let width = srcCanvas.width, height = srcCanvas.height;
    let s = params["saturationRange"];
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    let srcImageData = srcCtx.getImageData(0, 0, width, height);
    let dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    let rgba = getRGBA(srcImageData, x, y);
            rgba = saturation2(rgba, s);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
