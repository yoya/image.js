"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var offCanvas = document.createElement("canvas"); // 2^n size
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndDCT(srcImage, srcCanvas, offCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    draw2NCanvas(srcCanvas, offCanvas);
    drawDCT(offCanvas, dstCanvas);
}

function draw2NCanvas(srcCanvas, dstCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var w = Math.log2(srcCanvas.width) >>> 0;
    var h = Math.log2(srcCanvas.height) >>> 0;
    var n = (w < h)? w : h;
    var dstWidth = Math.pow(2, n);
    var dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(srcCanvas, 0, 0, srcWidth, srcHeight,
		     0, 0, dstWidth, dstHeight);
}


function drawDCT(srcCanvas, dstCanvas) {
    // console.log(srcCanvas); // XXX
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    dstCtx.fillStyle = '#ffffff';
    dstCtx.fillRect(0, 0, width, height);
    
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;

    //
    FFT.init(width);
    FrequencyFilter.init(width);
    SpectrumViewer.init(dstCtx);
    //var re = [];
    //var im = []
    var re = new Float32Array(width * height);
    var im = new Float32Array(width * height);
    var i = 0;
    for(var y = 0; y < height; y++) {
	for(var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = (3 * srcData[o++]  + 6 * srcData[o++]  + srcData[o++]) / 10;
	    re[i++] = val;
	    // im[i] = 0;
	}
    }
    FFT.fft2d(re, im);
    FrequencyFilter.swap(re, im);
    SpectrumViewer.render(re, im, true);
}
