"use strict";
/*
 * 2021/09/07- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "boostSelect":"",
                  "rgRange":"rgText", "ybRange":"ybText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawRGYB(srcCanvas, dstCanvas, params);
}

function boostRGYB(imageData, boost, rgyb, ratio) {
    let offset;
    switch (rgyb) {
    case 1:  // Red
        offset = 0;
        break;
    case 2:  // Green
        offset = 1;
        break;
    case 3:  // Yellow
        boostRGYB(imageData, boost, 1, ratio);  // Red
        boostRGYB(imageData, boost, 2, ratio);  // Green
        return ;
    case 4:  // Blue
        offset = 2;
        break;
    }
    const data = imageData.data;
    const length = data.length;
    switch (boost) {
    case "mul": {
        const ratio2 = 1 + ratio;
        for (let i = offset ; i < length ; i += 4) {
            data[i] *= ratio2;
        }
    }
        break;
    case "add": {
        const ratio2 = 255 * ratio;
        for (let i = offset ; i < length ; i += 4) {
            data[i] += ratio2;
        }
    }
        break;
    case "mid": {
        const ratio2 = 1 - ratio;
        for (let i = offset ; i < length ; i += 4) {
            data[i] = 255*ratio + data[i]*ratio2;
        }
    }
        break;
    default:
        console.error("Illegal boost", boost);
    }
}

function drawRGYB(srcCanvas, dstCanvas, params) {
    // console.debug("drawRGYB");
    const boost = params.boostSelect;
    const rg = params.rgRange;
    const yb = params.ybRange;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    let rgyb = 0, ratio;
    if (rg != 0) {
        if (rg < 0) {  // red boost
            rgyb = 1;
            ratio = - rg / 100;
        } else {  // green boost
            rgyb = 2;
            ratio = rg / 100;
        }
        boostRGYB(srcImageData, boost, rgyb, ratio);
    }
    if (yb != 0) {
        if (yb < 0) {  // yellow boost
            rgyb = 3;
            ratio = - yb / 100;
        } else {  // blue boost
            rgyb = 4;
            ratio = yb / 100;
        }
        boostRGYB(srcImageData, boost, rgyb, ratio);
    }
    dstCtx.putImageData(srcImageData, 0, 0);
}
