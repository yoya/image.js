"use strict";
/*
 * 2021/03/23- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    let srcCanvas = document.getElementById("srcCanvas");
    let dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndSaturation(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "filterSelect":null,
                  "saturationRange":"saturationText"},
		 function() {
		     drawSrcImageAndSaturation(srcImage, srcCanvas, dstCanvas, params);
		 }, params);
}

function drawSrcImageAndSaturation(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawSaturation(srcCanvas, dstCanvas, params);
}

function mogrifySaturation(imageData, s) {
    const data = imageData.data;
    const n = data.length;
    for (let i = 0; i < n; i++) {
        const [r, g, b, a] = data.subarray(i, i + 4);
        const m = Math.max(r, g, b);
        data[i] = m + (r - m) * s; i += 1;
        data[i] = m + (g - m) * s; i += 1;
        data[i] = m + (b - m) * s; i += 1;
        data[i] = a;
    }
}

function mogrifyCompose(imageData, imageData2, ratio, ratio2) {
    const data = imageData.data;
    const data2 = imageData2.data;
    const n = data.length;
    for (let i = 0; i < n; i++) {
        data[i] = data[i] * ratio + data2[i] * ratio2;
    }
}

function mogrifyGrayscale(imageData, amount) {
    const data = imageData.data;
    const n = data.length;
    for (let i = 0; i < n; i++) {
        const [r, g, b, a] = data.subarray(i, i + 4);
        data[i] = r*(0.2126 + 0.7874 * (1-amount)) +
            g*(0.7152 - 0.7152  * (1-amount)) +
            b*(0.0722 - 0.0722 * (1-amount));  i += 1;
        data[i] = r*(0.2126 - 0.2126 * (1-amount)) +
            g*(0.7152 + 0.2848  * (1-amount)) +
            b*(0.0722 - 0.0722 * (1-amount));  i += 1;
        data[i] = r*(0.2126 - 0.2126 * (1-amount)) +
            g*(0.7152 - 0.7152  * (1-amount)) +
            b*(0.0722 + 0.9278 * (1-amount));  i += 1;
        data[i] = a;
    }
}

function drawSaturation(srcCanvas, dstCanvas, params) {
    // console.debug("drawSaturation");
    let srcCtx = srcCanvas.getContext("2d");
    let dstCtx = dstCanvas.getContext("2d");
    let width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    let imageData = srcCtx.getImageData(0, 0, width, height);
    const filter = params.filterSelect;
    const saturation = params.saturationRange;
    switch (filter) {
    case "saturation":
        mogrifySaturation(imageData, saturation);
        break;
    case "grayscale":
        mogrifyGrayscale(imageData, 1 - saturation);
        break;
    case "satugray":
        const imageData2 = new ImageData(imageData.data.slice(0),
                                         imageData.width, imageData.height);
        mogrifySaturation(imageData, saturation);
        mogrifyGrayscale(imageData2, 1 - saturation);
        mogrifyCompose(imageData, imageData2, 0.5, 0.5);
        break;
    }
    dstCtx.putImageData(imageData, 0, 0);
}
