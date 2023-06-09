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
    const dstCanvasArr = ["dstCanvas1", "dstCanvas2", "dstCanvas3", "dstCanvas4", "dstCanvas"].map(function(id) { return document.getElementById(id); });
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
                  "amp1":"amp1Text", "amp2":"amp2Text",
                  "amp3":"amp3Text", "amp4":"amp4Text"},
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
    const { srcImageData, amp1, amp2, amp3, amp4 } = params;
    
    const {width, height, data } = srcImageData;
    const [rData, gData, bData, aData, dstData] = dstImageDataArr.map(function(idata) {
        return idata.data;
    });
    const count = width * height * 4;
    for (let i = 0; i < count; ) {
        rData[i] = data[i++];  rData[i++] = rData[i++] = 0;
        rData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        gData[i++] = 0;  gData[i] = data[i++];  gData[i++] = 0;
        gData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        bData[i++] = bData[i++] = 0;  bData[i] = data[i++];
        bData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        aData[i++] = aData[i++] = aData[i++] = data[i];
        aData[i++] = 255;
    }
    for (let i = 0; i < count; ) {
        dstData[i] = data[i++] * amp1;
        dstData[i] = data[i++] * amp2;
        dstData[i] = data[i++] * amp3;
        dstData[i] = data[i++] * amp4;
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
