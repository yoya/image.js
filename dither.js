"use strict";
/*
 * 2023/03/05- (c) yoya@awm.jp
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
	drawSrcImageAndDither(srcImage, srcCanvas, dstCanvas, params);
    }
    //    srcImage.src = "./img/RGBCube.png"
    srcImage.src = "./img/grad-white-magenta.png";
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndDither(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndDither(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawDither(srcCanvas, dstCanvas);
    rescaleCanvas(dstCanvas, 3);
}

function drawDither(srcCanvas, dstCanvas) {
    // console.debug("drawDither");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const { width, height } = srcCanvas;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const map = { width:4, height:4,
                  levels:[ 1 ,  9,  3, 11,
                           13,  5, 15,  7,
                           4 , 12,  2, 10,
                           16,  8, 14, 6],
                  divisor:17 };
    const levels = [4, 4, 4];
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const qrange = 255;
    const qscale = 1 / 255;
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
            for (let c = 0; c < 3; c++) {
                let th = (qscale * rgba[c] * ((levels[c] *
                                               (map.divisor-1) ) + 1) ) | 0;
                const level = (th / (map.divisor-1)) | 0;
                th -= level * (map.divisor-1);
                const m = map.levels[((x % map.width) +
                                      map.width * (y % map.height))];
                rgba[c] = (level + ((th >= m)? 1: 0)) * qrange / levels[c];
            }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
