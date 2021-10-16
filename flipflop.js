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
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "verticalCheckbox":null, "horizontalCheckbox":null},
		 function() {
		     drawSrcImageAndFlipflop(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndFlipflop(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawFlipflop(srcCanvas, dstCanvas, params);
}

function drawFlipflop(srcCanvas, dstCanvas, params) {
    // console.debug("drawFlipflop");
    const vertical = params.verticalCheckbox;
    const horizontal = params.horizontalCheckbox;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const srcData = new Uint32Array(srcImageData.data.buffer);
    const dstData = new Uint32Array(dstImageData.data.buffer);
    //
    if (vertical && horizontal) {
        dstData.set(srcData);
        dstData.reverse();
    } else if (vertical) {
        let srcOffset = 0, dstOffset = (height - 1) * width;
        for (let y = 0; y < height; y++) {
            const srcLine = srcData.subarray(srcOffset, srcOffset + width);
            dstData.set(srcLine, dstOffset);
            srcOffset += width;
            dstOffset -= width;
        }
    } else if (horizontal) {
        dstData.set(srcData);
        let srcOffset = 0;
        for (let y = 0; y < height; y++) {
            const dstLine = dstData.subarray(srcOffset, srcOffset + width);
            dstLine.reverse();
            srcOffset += width;
        }
    } else {
        dstData.set(srcData);
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

