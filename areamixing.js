"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
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
	drawSrcImageAndAreaMixing(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeightRange":"maxWidthHeightText",
                   "dxRange":"dxText", "dyRange":"dyText",
                   "dxdySyncCheckbox": null,
                   "methodSelect": null },
                 function(target, rel) {
                     let dxdyParams = ["dxRange", "dxText",
                                       "dyRange", "dyText"];
                     if (params.dxdySyncCheckbox &&
                         dxdyParams.includes(target.id)) {
                         let value = document.getElementById(target.id).value;
                         params.rxRange = dxRange.value = dxText.value = value;
                         params.ryRange = dyRange.value = dyText.value = value;
                     }
	             drawSrcImageAndAreaMixing(srcImage, srcCanvas, dstCanvas,
                                               params);
    }, params);
}

function drawSrcImageAndAreaMixing(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawAreaMixing(srcCanvas, dstCanvas, params);
}

function meanRGBA(rgbaArr) {
    let n = rgbaArr.length;
    let [r, g, b, a] = [0, 0, 0, 0]
    for (let i = 0; i < n ; i++) {
        const rgba = rgbaArr[i];
        r += rgba[0];
        g += rgba[1];
        b += rgba[2];
        a += rgba[3];
    }
    return [r / n, g / n, b / n, a / n];
}

var compareRGBAArrFunc = function(rgba1, rgba2) {
    const [r1, g1, b1, a1] = rgba1;
    const [r2, g2, b2, a2] = rgba2;
    const a = (2*(r1 + g1*2) + b1) * a1
    const b = (2*(r2 + g2*2) + b2) * a2;
    return a - b;
}
function medianRGBA(rgbaArr) {
    let n = rgbaArr.length;
    rgbaArr.sort(compareRGBAArrFunc);
    const medianOffset = (((n + 1) / 2) | 0);
    return rgbaArr[medianOffset];
}

function maxRGBA(rgbaArr) {
    let n = rgbaArr.length;
    rgbaArr.sort(compareRGBAArrFunc);
    return rgbaArr[n - 1];
}

function minRGBA(rgbaArr) {
    let n = rgbaArr.length;
    rgbaArr.sort(compareRGBAArrFunc);
    return rgbaArr[0];
}

function drawAreaMixing(srcCanvas, dstCanvas, params) {
    // console.debug("drawAreaMixing");
    const { dxRange, dyRange, methodSelect } = params;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    const dstWidth  = srcWidth;
    const dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    const dx = dxRange;
    const dy = dyRange;
    for (let dstY = 0 ; dstY < dstHeight; dstY += dy) {
        for (let dstX = 0 ; dstX < dstWidth; dstX += dx) {
            let rgbaArr = [];
            for (let y = 0 ; y < dy; y += 1) {
                for (let x = 0 ; x < dx; x += 1) {
                    const rgba2 = getRGBA(srcImageData, dstX + x, dstY + y);
	            rgbaArr.push(rgba2);
                }
            }
            let rgba = [255, 0, 255, 255]; // error color
            switch (methodSelect) {
            case "mean":
                rgba = meanRGBA(rgbaArr);
                break;
            case "median":
                rgba = medianRGBA(rgbaArr);
                break;
            case "max":
                rgba = maxRGBA(rgbaArr);
                break;
            case "min":
                rgba = minRGBA(rgbaArr);
                break;
            }
            for (let y = 0 ; y < dy; y += 1) {
                for (let x = 0 ; x < dx; x += 1) {
	            setRGBA(dstImageData, dstX + x, dstY + y, rgba);
                }
            }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
