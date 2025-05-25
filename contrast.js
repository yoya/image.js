"use strict";
/*
 * 2021/10/09- (c) yoya@awm.jp
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
	    drawSrcImageAndContrast(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeightRange":"maxWidthHeightText",
                   "amountRange":"amountText",
		   "RCheckbox":null,
		   "GCheckbox":null,
		   "BCheckbox":null },
		 function() {
		     drawSrcImageAndContrast(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndContrast(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawContrast(srcCanvas, dstCanvas, params);
}


function contrast(rgba, slope, intercept, R, G, B) {
    return [
        R? (rgba[0] * slope + intercept * 255): rgba[0],
        G? (rgba[1] * slope + intercept * 255): rgba[1],
        B? (rgba[2] * slope + intercept * 255): rgba[2],
        rgba[3]
    ];
}

function drawContrast(srcCanvas, dstCanvas, params) {
    const amount = params.amountRange;
    const R = params.RCheckbox;
    const G = params.GCheckbox;
    const B = params.BCheckbox;
    console.debug("drawContrast", {amount, R, G, B});
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    //
    // https://drafts.fxtf.org/filter-effects/#contrastEquivalent
    const slope = amount;
    const intercept = - (0.5 * amount) + 0.5;
    //
    console.log("slope:"+slope, " intercept:"+intercept);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
	    setRGBA(dstImageData, x, y, contrast(rgba, slope, intercept, R, G, B));
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
