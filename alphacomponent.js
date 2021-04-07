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
    drawAlphacomponent(srcImageData, srcCanvas, dstCanvasArr, ampArr, maxWidthHeight);
}
    
function alphacomponent(imageData, dstImageDataArr, ampArr) {
    var data = imageData.data;
    var [rData, gData, bData, aData, dstData] = dstImageDataArr.map(function(idata) {
        return idata.data;
    });
    var [rAmp, gAmp, bAmp, aAmp] = ampArr;
    var count = imageData.width * imageData.height * 4;
    var i;
    for (i = 0; i < count; ) {
        rData[i] = data[i++];  rData[i++] = rData[i++] = 0;
        rData[i++] = 255;
    }
    for (i = 0; i < count; ) {
        gData[i++] = 0;  gData[i] = data[i++];  gData[i++] = 0;
        gData[i++] = 255;
    }
    for (i = 0; i < count; ) {
        bData[i++] = bData[i++] = 0;  bData[i] = data[i++];
        bData[i++] = 255;
    }
    for (i = 0; i < count; ) {
        aData[i++] = aData[i++] = aData[i++] = data[i];
        aData[i++] = 255;
    }
    for (i = 0; i < count; ) {
        dstData[i] = data[i++] * rAmp;
        dstData[i] = data[i++] * gAmp;
        dstData[i] = data[i++] * bAmp;
        dstData[i] = data[i++] * aAmp;
    }
}

function drawAlphacomponent(srcImageData, srcCanvas, dstCanvasArr, ampArr,
                            maxWidthHeight) {
    var dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext("2d");
    });
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(srcWidth, srcHeight);
    });
    alphacomponent(srcImageData, dstImageDataArr, ampArr);
    dstImageDataArr.forEach(function(imageData, i) {
        drawSrcImageData(imageData, dstCanvasArr[i], maxWidthHeight);
    });
}
