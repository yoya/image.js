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
                  "widthRange":"widthText",
                  "cheatRange":"cheatText"},
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

function grayColor(rgba) {
    const [r, g, b, a] = rgba;
    // CIE XYZ (BT.709 coeff & linear)
    const lr = 0.2126 * Math.pow(r / 255, 2.2);
    const lg = 0.7152 * Math.pow(g / 255, 2.2);
    const lb = 0.0722 * Math.pow(b / 255, 2.2);
    const v =  Math.pow(lr + lg + lb, 1 / 2.2) * 255;
    return [v, v, v, a];
}

function isGrid(x, y, period, width) {
    const xy1 = (x + y) % period;
    if ((xy1 < width) || (xy1 > (period-width))) {
        return true;
    }
    const xy2 = Math.abs(x - y) % period;
    if ((xy2 < width) || (xy2 > (period-width))) {
        return true;
    }
    return false;
}

function gridChrome(x, y, rgba, params) {
    const [r, g, b, a] = rgba;
    const period = params.periodRange;
    const width = params.widthRange;
    const cheat = params.cheatRange;
    if (isGrid(x, y, period, width/2)) {
        return rgba;
    }
    if (isGrid(x, y, period, width)) {
        return grayColor(rgba).map(function(v, i) {
            return (rgba[i]*(cheat/10) + v) / ((cheat/10)+ 1);
        });
    }
    return grayColor(rgba).map(function(v, i) {
        return (rgba[i]*(cheat/100) + v) / ((cheat/100)+ 1);
    });
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
