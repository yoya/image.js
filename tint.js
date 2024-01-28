"use strict";
/*
 * 2024/01/28- (c) yoya@awm.jp
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
	drawSrcImageAndTint(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeight": "maxWidthHeightText",
                   "equation": null,
                   "color": "colorText",
                   "amount": "amountText",
                   "linear": null },
		 function() {
		     drawSrcImageAndTint(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndTint(srcImage, srcCanvas, dstCancas, params) {
    const { maxWidthHeight } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawTint(srcCanvas, dstCanvas, params);
}
function tintWeightFlat(a) {
    return 0.5;
}

function tintWeightQuadratic(a) {
    a -= 0.5;
    return 1 - (4 * a * a);
}

function tintWeightQuadratic2(a) {  // XXX
    return 1 - (4 * a * a);
}

function tintWeightLanczos(a) {
    a -= 0.5;
    return lanczos(a*2, 1)
}

function tint(a, b, weightFunc, amount) {
    const w = weightFunc(a)
    let w2;
    if (amount > 0.5) {
        const r = (amount - 0.5) * 2;
        w2 = w * (1-r) + r;
    } else {
        const r = (0.5 - amount)  * 2;
        w2 = w * (1-r);
    }
    return a + b * w2;
}

function drawTint(srcCanvas, dstCanvas, params) {
    const { equation, color, amount, linear } = params;
    console.debug("drawTint", {equation, color, amount});
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const twFunc = { "flat"      : tintWeightFlat,
                     "quadratic" : tintWeightQuadratic,
                     "quadratic2": tintWeightQuadratic2,
                     "lanczos"   : tintWeightLanczos} [equation]
    
    const color_rgba = getRGBAfromHexColor(color);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    let [r,g,b,a] = getRGBA(srcImageData, x, y);
            [r, g, b, a] = linear? sRGB2linearRGB([r,g,b,a]):
                [r / 255, g/255, b/255, a/255];
            r = tint(r, color_rgba[0]/255, twFunc, amount);
            g = tint(g, color_rgba[1]/255, twFunc, amount);
            b = tint(b, color_rgba[2]/255 ,twFunc, amount);
            a = tint(a, color_rgba[3]/255 ,twFunc, amount);
            const rgba2 = linear?linearRGB2sRGB([r,g,b,a]):
                  [r*255,g*255,b*255,a*255];
	    setRGBA(dstImageData, x, y, rgba2);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
