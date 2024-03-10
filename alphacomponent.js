"use strict";
/*
 * 2021/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvasArr = ["dstCanvas0", "dstCanvas1", "dstCanvas2", "dstCanvas3", "dstCanvas4", "dstCanvas"].map(function(id) { return document.getElementById(id); });
    const params = { srcCanvas, dstCanvasArr };
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
            params.srcImageData = imageData;
            drawSrcImageDataAndAlphacomponent(params);
        });
    }, "DataURL");
    //
    bindFunction({"maxWidthHeight":"maxWidthHeightText",
                  "multi1":"multi1Text", "plus1":"plus1Text",
                  "multi2":"multi2Text", "plus2":"plus2Text",
                  "multi3":"multi3Text", "plus3":"plus3Text",
                  "multi4":"multi4Text", "plus4":"plus4Text"},
		 function() {
		     drawSrcImageDataAndAlphacomponent(params);
		 }, params);
}

function drawSrcImageDataAndAlphacomponent(params) {
    const { srcImageData, srcCanvas, maxWidthHeight } = params;
    drawSrcImageData(srcImageData, srcCanvas, maxWidthHeight);
    drawAlphacomponent(params);
}
    
function alphacomponent(dstImageDataArr, params) {
    const { srcImageData, multi1, multi2, multi3, multi4,
            plus1, plus2, plus3, plus4,
            } = params;
    
    const {width, height, data } = srcImageData;
    const [rgbData, rData, gData, bData, aData, dstData] = dstImageDataArr.map(function(idata) {
        return idata.data;
    });
    const count = width * height * 4;
    for (let i = 0; i < count; ) {
        rData[i] = (data[i++] * multi1) + (plus1 * 255);
        rData[i++] = rData[i++] = 0;
        rData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        gData[i++] = 0;
        gData[i] = (data[i++] * multi2) + (plus2 * 255);
        gData[i++] = 0;
        gData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        bData[i++] = bData[i++] = 0;
        bData[i] = (data[i++] * multi3) + (plus3 * 255);
        bData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        aData[i++] = aData[i++] = aData[i++] = (data[i] * multi4) + (plus4 * 255);
        aData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        rgbData[i] = (data[i++] * multi1) + (plus1 * 255);
        rgbData[i] = (data[i++] * multi2) + (plus2 * 255);
        rgbData[i] = (data[i++] * multi3) + (plus3 * 255);
        rgbData[i] = 255; i++;
    }
    for (let i = 0; i < count; ) {
        dstData[i] = (data[i++] * multi1) + (plus1 * 255);
        dstData[i] = (data[i++] * multi2) + (plus2 * 255);
        dstData[i] = (data[i++] * multi3) + (plus3 * 255);
        dstData[i] = (data[i++] * multi4) + (plus4 * 255);
    }
}

function drawAlphacomponent(params) {
    const { srcImageData, srcCanvas, dstCanvasArr, maxWidthHeight } = params;
    const dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext("2d");
    });
    const srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    const dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(srcWidth, srcHeight);
    });
    alphacomponent(dstImageDataArr, params);
    dstImageDataArr.forEach(function(imageData, i) {
        drawSrcImageData(imageData, dstCanvasArr[i], maxWidthHeight);
    });
}
