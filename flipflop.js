"use strict";
/*
 * 2021/10/16- (c) yoya@awm.jp
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
	    drawSrcImageAndFlipflop(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindParams(params, function(key, target, rel) {
		     drawSrcImageAndFlipflop(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, {keys: ["maxWidthHeight", "vertical", "horizontal"]});
}

function drawSrcImageAndFlipflop(srcImage, srcCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeight;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawFlipflop(srcCanvas, dstCanvas, params);
}

function drawFlipflop(srcCanvas, dstCanvas, params) {
    // console.debug("drawFlipflop");
    const vertical = params.vertical;
    const horizontal = params.horizontal;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const imageData = srcCtx.getImageData(0, 0, width, height);
    const data = new Uint32Array(imageData.data.buffer);
    const n = data.length;
    //
    if (vertical && horizontal) {
        data.reverse();
    } else if (vertical) {
        const lineData = new (data.constructor)(width);
        for (let i = 0, j = n - width; i < j; i += width, j -= width) {
            lineData.set(data.subarray(i, i + width));
            data.set(data.subarray(j, j + width), i);
            data.set(lineData, j);
        }
    } else if (horizontal) {
        for (let i = 0; i < n; i += width) {
            data.subarray(i, i + width).reverse();
        }
    }
    dstCtx.putImageData(imageData, 0, 0);
}

