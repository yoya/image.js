"use strict";
/*
 * 2023/05/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcImage = new Image();
    const params = {};
    srcImage.onload = function() {
	drawSrcImageAndGlitchRGB(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "dxR":"dxRText", "dyR":"dyRText",
                  "dxG":"dxGText", "dyG":"dyGText",
                  "dxB":"dxBText", "dyB":"dyBText",
                  "dxA":"dxAText", "dyA":"dyAText"},
                 function() {
		     drawSrcImageAndGlitchRGB(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndGlitchRGB(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGlitchRGB(srcCanvas, dstCanvas, params);
}

function drawGlitchRGB(srcCanvas, dstCanvas, params) {
    // console.debug("drawGlitchRGB");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const {dxR, dxG, dxB, dxA} = params;
    const {dyR, dyG, dyB, dyA} = params;
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            const rgbaR = getRGBA(srcImageData, x-dxR, y-dyR, OUTFILL_EDGE);
            const rgbaG = getRGBA(srcImageData, x-dxG, y-dyG, OUTFILL_EDGE);
            const rgbaB = getRGBA(srcImageData, x-dxB, y-dyB, OUTFILL_EDGE);
            const rgbaA = getRGBA(srcImageData, x-dxA, y-dyA, OUTFILL_EDGE);
            const data = dstImageData.data;
            const offset =  4 * (x + y * width);
            data[offset + 0] = rgbaR[0];
            data[offset + 1] = rgbaG[1];
            data[offset + 2] = rgbaB[2];
            data[offset + 3] = rgbaA[3];
        }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
