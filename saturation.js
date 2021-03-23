"use strict";
/*
 * 2021/03/23- (c) yoya@awm.jp
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

function saturation(rgba, s) {
    let a = rgba[3];
    let m = Math.max(rgba[0], rgba[1], rgba[2]);
    rgba = rgba.map(v => m + (v - m) * s);
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
            rgba = saturation(rgba, s);
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
