"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas1 = document.getElementById("dstCanvas1");
    var dstCanvas2 = document.getElementById("dstCanvas2");
    var dstCanvas3 = document.getElementById("dstCanvas3");
    var dstCanvas4 = document.getElementById("dstCanvas4");
    var dstCanvasArr = [dstCanvas1, dstCanvas2, dstCanvas3, dstCanvas4];
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var component = document.getElementById("componentSelect").value;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 } );
    bindFunction({"componentSelect":null},
		 function() {
		     component = document.getElementById("componentSelect").value;
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 } );
    //
}

function drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorComponent(srcCanvas, dstCanvasArr, component);
}

function colorComponent(imageData, x, y, component) {
    var [r, g, b, a] = getRGBA(imageData, x, y);
    var rgbaArr;
    switch (component) {
    case "rgb":
	var rgba1 = [r, 0, 0, a];
	var rgba2 = [0, g, 0, a];
	var rgba3 = [0, 0, b, a];
	rgbaArr = [rgba1, rgba2, rgba3];
	break;
    case "cmyk": // naive convert
	var [c, m, y, k] = RGB2CMYK([r, g, b]);
	var rgb1 = CMYK2RGB([c, 0, 0, 0]);
	var rgb2 = CMYK2RGB([0, m, 0, 0]);
	var rgb3 = CMYK2RGB([0, 0, y, 0]);
	var rgb4 = CMYK2RGB([0, 0, 0, k]);
	rgbaArr = [rgb1, rgb2, rgb3, rgb4].map(function(arr) {
	    arr.push(a) ; return arr;
	});
	break;
    case "ycbcr": // naive convert
	var [yy, cb, cr] = RGB2YCbCr([r, g, b]);
	var rgb1 = YCbCr2RGB([yy, 128, 128]);
	var rgb2 = YCbCr2RGB([128, cb, 128]);
	var rgb3 = YCbCr2RGB([128, 128, cr]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a) ; return arr;
	});
	break;
    default:
	console.error("Illegal component:"+component);
    }
    return rgbaArr;
}

function drawColorComponent(srcCanvas, dstCanvasArr, component) {
    // console.debug("drawColorTransform");
    var srcCtx = srcCanvas.getContext("2d");
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
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(dstWidth, dstHeight);
    });
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgbaArr = colorComponent(srcImageData, srcX, srcY, component);
	    for (var i = 0, n = rgbaArr.length ; i < n ; i++) {
		setRGBA(dstImageDataArr[i], dstX, dstY, rgbaArr[i]);
	    }
	}
    }
    for (var i = 0, n = dstImageDataArr.length ; i < n ; i++) {
	dstCtxArr[i].putImageData(dstImageDataArr[i], 0, 0);
    }
}
