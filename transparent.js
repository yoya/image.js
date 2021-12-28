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
    const viewCanvas = document.getElementById("viewCanvas");
    const srcCtx = srcCanvas.getContext("2d");
    const viewCtx = viewCanvas.getContext("2d");
    const transparentColorRect = document.getElementById("transparentColorRect");
    const transparentColorText = document.getElementById("transparentColorText");
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
        const {x, y} = params[target.id];
        const {width, height} = srcCanvas;
        const srcImageData = srcCtx.getImageData(0, 0, width, height);
        if (eventType === "mousedown") {
            const rgba = getRGBA(srcImageData, x, y);
            const [r,g,b,a] = rgba;
            const colorText = "RGBA("+r+","+g+","+b+","+a+")";
            const fgColor = "rgba("+r+","+g+","+b+")";
            transparentColorRect.style.backgroundColor = fgColor;
            transparentColorText.innerText = colorText;
            params.transparentColor = rgba;
            drawSrcImageAndTransparent(srcImage, srcCanvas, dstCanvas, params);
        } else if (eventType === "mousemove") {
            if ((x < 0) || (width <= x) || (y < 0) || (height < y)) {
                return ;  // out of canvas area
            }
            const viewSizeX = 12, viewSizeY = 10;
            const viewCenterX = Math.round(viewSizeX - 1) / 2;
            const viewCenterY = Math.round(viewSizeY - 1) / 2;
            viewCtx.drawImage(srcCanvas, x - viewCenterX, y - viewCenterY,
                              viewSizeX, viewSizeY, 0, 0,
                              viewCanvas.width, viewCanvas.height);
        } else if (eventType === "mouseleave") {
            viewCanvas.width = viewCanvas.width;  // canvas clear
        }
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
    const transparentColor = params.transparentColor;
    //
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    //
    if (transparentColor) {
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
	        const rgba = getRGBA(srcImageData, x, y);
                if (similarRGBA(transparentColor, rgba, fuzz)) {
                    rgba[3] = alpha;
                }
	        setRGBA(dstImageData, x, y, rgba);
	    }
        }
    } else {
        dstImageData.data.set(srcImageData.data);
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
