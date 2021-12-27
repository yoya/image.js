"use strict";
/*
 * 2021/12/27- (c) yoya@awm.jp
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
	    drawSrcImageAndTransparent(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "alphaRange":"alphaText",
                  "fuzzRange":"fuzzText"},
		 function() {
		     drawSrcImageAndTransparent(srcImage, srcCanvas, dstCanvas,
                                                params);
		 }, params);
    bindCursolFunction("srcCanvas", params, function(target, eventType) {
        if (eventType !== "mousedown") { return false ; }
        const {x, y} = params[target.id];
        params.x = x;
        params.y = y;
        drawSrcImageAndTransparent(srcImage, srcCanvas, dstCanvas, params);
    });
}

function drawSrcImageAndTransparent(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawTransparent(srcCanvas, dstCanvas, params);
}

function drawTransparent(srcCanvas, dstCanvas, params) {
    // console.debug("drawTransparent");
    const alpha = params.alphaRange;
    const fuzz = params.fuzzRange;
    //
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const transparentColor = getRGBA(srcImageData, params.x, params.y);
    //
    if ((params.x === undefined) || (params.y === undefined)) {
        dstImageData.data.set(srcImageData.data);
    } else {
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
	        const rgba = getRGBA(srcImageData, x, y);
                if (similarRGBA(transparentColor, rgba, fuzz)) {
                    rgba[3] = alpha;
                }
	        setRGBA(dstImageData, x, y, rgba);
	    }
        }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
