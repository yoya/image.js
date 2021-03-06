"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndShowa(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas);
}

function colortrans_showa(r, g, b, a) {
    return [
        0.65 * r + 0.25 * g + 0.10 * b,
        0.00 * r + 0.80 * g + 0.20 * b,
        0.10 * r + 0.20 * g + 0.70 * b,
        a
    ];
}
    
function noize_showa() {
    const r0 = Math.random(), r1 = 32 * Math.random()
    let rr = 0, rg = 0, rb = 0;
    if (r0 < 0.25) {
        rr = r1 * Math.random();
    } else if (r0 < 0.75) {
        rg = r1 * Math.random();
    } else {
        rb = r1 * Math.random();
    }
    return [rr, rg, rb];
}

function mozaic_showa(imageData) {
    let width = imageData.width, height = imageData.height;
    for (let y1 = 3; y1 < height; y1++) {
        for (let x1 = 3; x1 < width; x1++) {
            var x2 = x1 + (3*(Math.random()-0.5)) | 0;
            var y2 = y1 + (3*(Math.random()-0.5)) | 0;
            let rgba1 = getRGBA(imageData, x1, y1, OUTFILL_EDGE);
            let rgba2 = getRGBA(imageData, x2, y2, OUTFILL_EDGE);
            let [dr, dg, db] = noize_showa();
            rgba1[0] -= dr;  rgba1[1] -= dg; rgba1[2] -= db;
            rgba2[0] += dr;  rgba2[1] += dg; rgba2[2] += db;
            setRGBA(imageData, x1, y1, rgba1);
            setRGBA(imageData, x2, y2, rgba2);
        }
    }
}

function drawShowa(srcCanvas, dstCanvas) {
    console.debug("drawShowa");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const tmpImageData = srcCtx.getImageData(0, 0, width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const [r, g, b, a] = getRGBA(srcImageData, x, y);
            const rgba = colortrans_showa(r, g, b, a)
	    setRGBA(tmpImageData, x, y, rgba);
	}
    }
    const params_vinette = { radius:1.0, linearGamma:false, inverse:false };
    mogrifyVinette(tmpImageData, params_vinette);
    mozaic_showa(tmpImageData);
    const filterWindow = 3;
    const filterMatrix = makeKernel_PascalTriangle(filterWindow);
    const params_smoothing = {
        filterMatrix: filterMatrix,
        filterWindow: filterWindow,
        sigma: null,
        bilateral: false,
        colorScale: null
    };
    const dstImageData = convertSmoothing(tmpImageData, params_smoothing)
    dstCtx.putImageData(dstImageData, 0, 0);
}
