"use strict";
/*
 * 2017/11/26- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas1 = document.getElementById("dstCanvas1");
    const dstCanvas2 = document.getElementById("dstCanvas2");
    const dstCanvas3 = document.getElementById("dstCanvas3");
    const dstCanvasArr = [dstCanvas1, dstCanvas2, dstCanvas3];
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const mosaicCheckbox = document.getElementById("mosaicCheckbox");
    let mosaic = mosaicCheckbox.checkded
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, mosaic);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "mosaicCheckbox":null},
		 function() {
		     mosaic = mosaicCheckbox.checked;
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, mosaic);
		 } );
}

function drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, mosaic) {
    const maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorComponent(srcCanvas, dstCanvasArr, mosaic);
}

function colorComponent(imageData, x, y, mosaic) {
    // console.log("colorComponent:", imageData, x, y, mosaic);
    if (mosaic) {
	x -= x%5;
	y -= y%5;
    }
    const rgba = getRGBA(imageData, x, y);
    const [r, g, b, a] = rgba;
    let rgbaArr;
    if (Math.floor(x/5) % 2 ) {
	rgbaArr = [[r, 0, 0, a],
		   [0, g, 0, a],
		   [0, 0, b, a]];
    } else {
	rgbaArr = [[0, g, b, a],
		   [r, 0, b, a],
		   [r, g, 0, a]];
    }
    return rgbaArr;
}

function drawColorComponent(srcCanvas, dstCanvasArr, mosaic) {
    // console.debug("drawColorTransform");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext("2d");
    });
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvasArr.forEach(function(c) {
	c.width  = width; c.height = height;
    });

    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(width, height);
    });
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgbaArr = colorComponent(srcImageData, x, y, mosaic);
	    for (let i = 0, n = rgbaArr.length ; i < n ; i++) {
		setRGBA(dstImageDataArr[i], x, y, rgbaArr[i]);
	    }
	}
    }
    for (let i = 0, n = dstImageDataArr.length ; i < n ; i++) {
	dstCtxArr[i].putImageData(dstImageDataArr[i], 0, 0);
    }
}
