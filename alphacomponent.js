"use strict";
/*
 * 2021/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvasArr = ["dstCanvas1", "dstCanvas2", "dstCanvas3", "dstCanvas4", "dstCanvas"].map(function(id) { return document.getElementById(id); });
    var srcImageData = new ImageData(srcCanvas.width, srcCanvas.height);
    //
    dropFunction(document, function(dataURL) {
        /*
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndAlphacomponent(srcImage, srcCanvas, dstCanvasArr);
	}
	srcImage.src = dataURL;
        */
        loadImageData(dataURL, function(imageData) {
            srcImageData = imageData;
            drawSrcImageDataAndAlphacomponent(srcImageData, srcCanvas, dstCanvasArr);
        });
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageDataAndAlphacomponent(srcImageData, srcCanvas, dstCanvasArr);
		 } );
    bindFunction({"amp1Range":"amp1Text", "amp2Range":"amp2Text",
                  "amp3Range":"amp3Text", "amp4Range":"amp4Text"},
		 function() {
		     drawSrcImageDataAndAlphacomponent(srcImageData, srcCanvas, dstCanvasArr);
		 } );
}

function drawSrcImageDataAndAlphacomponent(srcImageData, srcCanvas, dstCanvasArr) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var ampIdArr = ["amp1Range", "amp2Range", "amp3Range", "amp4Range"];
    var ampArr = ampIdArr.map(function(id) { return parseFloat(document.getElementById(id).value); });
    drawSrcImageData(srcImageData, srcCanvas, maxWidthHeight);
    drawAlphacomponent(srcImageData, srcCanvas, dstCanvasArr, ampArr);
}
    
function alphacomponent(imageData, x, y, ampArr) {
    var rgba = getRGBA(imageData, x, y);
    var [r, g, b, a] = rgba;
    var rgbaArr;
    var rgb1, rgb2, rgb3, rgb4 = null, rgb5;
    r *= ampArr[0];
    g *= ampArr[1];
    b *= ampArr[2];
    a *= ampArr[3];
    rgb1 = [r, 0, 0, 255];
    rgb2 = [0, g, 0, 255];
    rgb3 = [0, 0, b, 255];
    rgb4 = [a, a, a, 255];
    rgb5 = [r, g, b, a];
    rgbaArr = [rgb1, rgb2, rgb3, rgb4, rgb5].map(function(arr) {
	arr.push(a) ; return arr;
    });
    return rgbaArr;
}

function drawAlphacomponent(srcImageData, srcCanvas, dstCanvasArr, ampArr) {
    // console.debug("drawColorTransform");
    var dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext("2d");
    });
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvasArr.forEach(function(c) {
	c.width  = dstWidth; c.height = dstHeight;
    });

    //
    var dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(dstWidth, dstHeight);
    });
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgbaArr = alphacomponent(srcImageData, srcX, srcY, ampArr);
	    for (var i = 0, n = rgbaArr.length ; i < n ; i++) {
                if (rgbaArr[i] !== null) {
		    setRGBA(dstImageDataArr[i], dstX, dstY, rgbaArr[i]);
                }
	    }
	}
    }
    for (var i = 0, n = dstImageDataArr.length ; i < n ; i++) {
	dstCtxArr[i].putImageData(dstImageDataArr[i], 0, 0);
    }
}
