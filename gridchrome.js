"use strict";
/*
 * 2011/01/29- (c) yoya@awm.jp
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
	drawSrcImageAndGridChrome(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "periodRange":"periodText",
                  "widthRange":"widthText"},
		 function() {
		     drawSrcImageAndGridChrome(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndGridChrome(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGridChrome(srcCanvas, dstCanvas, params);
}

function grayscale(r, g, b) {
    return (2*r + 4*g + b) / 7;
}
function grayColor(rgba) {
    const [r, g, b, a] = rgba;
    const v = grayscale(r, g, b);
    return [v, v, v, a];
}

function isGrid(x, y, period, width) {
    if (((x + y) % period) < width) {
        return true;
    }
    if ((Math.abs(x - y) % period) < width) {
        return true;
    }
    return false;
}

function gridChrome(x, y, rgba, params) {
    const [r, g, b, a] = rgba;
    const period = params.periodRange;
    const width = params.widthRange;
    if (isGrid(x, y, period, width)) {
        return rgba;
    }
    return grayColor(rgba);
}

function drawGridChrome(srcCanvas, dstCanvas, params) {
    // console.debug("drawGridChrome");
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
	    setRGBA(dstImageData, x, y, gridChrome(x, y, rgba, params));
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
