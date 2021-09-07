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

function boostRGYB(imageData, rgyb, ratio) {
    let offset;
    switch (rgyb) {
    case 1:  // Red
        offset = 0;
        break;
    case 2:  // Green
        offset = 1;
        break;
    case 3:  // Yellow
        boostRGYB(imageData, 1, ratio);  // Red
        boostRGYB(imageData, 2, ratio);  // Green
        return ;
    case 4:  // Blue
        offset = 2;
        break;
    }
    const ratio2 = 1 - ratio;
    const data = imageData.data;
    const length = data.length;
    console.debug({rgyb, offset, length, ratio});
    for (let i = offset ; i < length ; i += 4) {
        data[i] = 255*ratio + data[i]*ratio2;
    }
}

function drawRGYB(srcCanvas, dstCanvas, params) {
    // console.debug("drawRGYB");
    const rg = params.rgRange;
    const yb = params.ybRange;
    console.log("rg, yb", rg, yb);
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    let rgyb = 0, ratio;
    if (rg != 0) {
        if (rg < 0) { // red boost
            rgyb = 1;
            ratio = - rg / 100;
        } else { // green boost
            rgyb = 2;
            ratio = rg / 100;
        }
        boostRGYB(srcImageData, rgyb, ratio);
    }
    if (yb != 0) {
        if (yb < 0) { // yellow boost
            rgyb = 3;
            ratio = - yb / 100;
        } else { // blue boost
            rgyb = 4;
            ratio = yb / 100;
        }
        boostRGYB(srcImageData, rgyb, ratio);
    }
    dstCtx.putImageData(srcImageData, 0, 0);
}
