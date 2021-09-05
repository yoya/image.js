"use strict";
/*
 * 2018/11/10- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    const params = {};
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearCheckbox":null,
                  "amountRange":"amountText"},
		 function() {
		     drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCanvas,
                                             params);
		 }, params);
}


function drawSrcImageAndSepiaTone(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    const linear = params.linearCheckbox;
    const amount = params.amountRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSepiaTone(srcCanvas, dstCanvas, linear, amount);
}

// https://twitter.com/soramimi_jp/status/1061053416061906946
// https://github.com/soramimi/Sepia

function sepiaTone(rgba, linear, amount) {
    let [r, g, b, a] = rgba;
    [r, g, b] = (linear)? sRGB2linearRGB(rgba): [r/255, g/255, b/255];
    let sr = Math.pow(r, 0.62) * 205 + 19;
    let sg = Math.pow(g, 1.00) * 182 + 17;
    let sb = Math.pow(b, 1.16) * 156 + 21;
    if (amount < 1.0) {
        sr = sr * amount + r*255 * (1-amount);
        sg = sg * amount + g*255 * (1-amount);
        sb = sb * amount + b*255 * (1-amount);
    }
    if (linear) {
        [sr, sg, sb] = linearRGB2sRGB([sr/255, sg/255, sb/255])
    }
    return [sr, sg, sb, a];
}

function drawSepiaTone(srcCanvas, dstCanvas, linear, amount) {
    // console.debug("drawSepiaTone");
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
            const rgba_sepia = sepiaTone(rgba, linear, amount);
	    setRGBA(dstImageData, x, y, rgba_sepia);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
