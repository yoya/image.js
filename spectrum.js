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
    var src2NCanvas = document.getElementById("src2NCanvas"); // 2^n size
    var dst2NCanvas = document.getElementById("dst2NCanvas"); // 2^n size
    var srcSpectrumCanvas = document.getElementById("srcSpectrumCanvas");
    var dstSpectrumCanvas = document.getElementById("dstSpectrumCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas, srcSpectrumCanvas, dstSpectrumCanvas, dst2NCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "highPassRange":"highPassText",
		  "lowPassRange":"lowPassText"},
		 function() {
		     drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas, srcSpectrumCanvas, dstSpectrumCanvas, dst2NCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndDCTAndFilter(srcImage, srcCanvas, src2NCanvas, srcSpectrumCanvas, dstSpectrumCanvas, dst2NCanvas, dstCanvas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var highPass = parseFloat(document.getElementById("highPassRange").value);
    var lowPass = parseFloat(document.getElementById("lowPassRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    draw2NCanvas(srcCanvas, src2NCanvas);

    var [re, im] = calcDCT(src2NCanvas);
    drawSpectrum(srcSpectrumCanvas, re, im);
    [re, im] = SpectrumFilter(re, im, highPass, lowPass);
    drawSpectrum(dstSpectrumCanvas, re, im);
    drawFromDCT(dst2NCanvas, re, im)
    dstCanvas.width  = srcCanvas.width;
    dstCanvas.height = srcCanvas.height;
    drawFrom2NCanvas(dst2NCanvas, dstCanvas);
}

function draw2NCanvas(srcCanvas, dstCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width;
    var srcHeight = srcCanvas.height;
    var w = Math.floor(Math.log2(srcCanvas.width));
    var h = Math.floor(Math.log2(srcCanvas.height));
    var n = (w < h)? w : h;
    var dstWidth = Math.pow(2, n);
    var dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    dstCtx.drawImage(srcCanvas, 0, 0, srcWidth, srcHeight,
		     0, 0, dstWidth, dstHeight);
}

function calcDCT(srcCanvas) {
    // console.log(srcCanvas); // XXX
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    var srcData = srcImageData.data;
    //
    FFT.init(width);
    var nSample = width * height;
    var re = new Float32Array(nSample);
    var im = new Float32Array(nSample);
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
    swapQuadrant(re, width, height);
    swapQuadrant(im, width, height);
    return [re, im]
}

function drawSpectrum(dstCanvas, re, im) {
    var dstCtx = dstCanvas.getContext("2d");
    var nSample = re.length;
    var width = Math.sqrt(nSample);
    var height = width;
    dstCanvas.width = width;
    dstCanvas.height = height;
    //
    // dstCtx.fillStyle = '#ffffff';
    // dstCtx.fillRect(0, 0, width, height);
    var dstImageData = dstCtx.createImageData(width, height);
    var dstData = dstImageData.data;
    //
    var spectrum = new Float32Array(nSample);
    var maxSpectrum = 0;
    for (var i = 0 ; i < nSample ; i++) {
	var s = Math.log(Math.sqrt(re[i]*re[i] + im[i]*im[i]));
	spectrum[i] = s;
	if (s > maxSpectrum) {
	    maxSpectrum = s;
	}
    }
    var i = 0;
    var normFactor = 255 / maxSpectrum;
    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = spectrum[i] * normFactor;
	    dstData[o++] = 64 + (val >> 2);
	    dstData[o++] = val;
	    dstData[o++] = val >> 1;
	    dstData[o++] = 255;
	    i++;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    return [re, im];
}

// 象限シフト
function swapQuadrant(data, width, height) {
    var nSample = width * height
    var nSample_2 = nSample / 2;
    var nSample_3 = nSample * 3 / 4;
    var width_2 = width / 2 , height_2 = height / 2;
    var i, j;
    for (var y = 0 ; y < height_2 ; y++) {
	i = y * width;
	j = i + nSample_2 + width_2;
	for (var x = 0 ; x < width_2 ; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
    for (var y = 0 ; y < height_2 ; y++) {
	i = y * width + width_2;
	j = i + nSample_2 - width_2;
	for (var x = width_2 ; x < width; x++) {
	    [data[i], data[j]] = [data[j], data[i]];
	    i++; j++;
	}
    }
}

function SpectrumFilter(re, im, highPass, lowPass) {
    var nSample = re.length;
    var width = Math.sqrt(nSample);
    var height = width;
    var centerX = (width +1)/ 2, centerY = (height+1) / 2; 
    var i = 0;
    for (var y = 0; y < height; y++) {
	for (var x = 0; x < width; x++) {
	    var dx = x - centerX;
	    var dy = y - centerY
	    var distance = Math.sqrt(dx*dx + dy*dy);
	    var ratio = distance / width;
	    if ((ratio < highPass) || (lowPass < ratio)) {
		re[i] = 0;
		im[i] = 0;
	    }
	    i++;
	}
    }
    return [re, im];
}

function drawFromDCT(dstCanvas, re, im) {
    var dstCtx = dstCanvas.getContext("2d");
    var nSample = re.length;
    var width = Math.sqrt(nSample);
    var height = width;
    dstCanvas.width = width;
    dstCanvas.height = height;
    //
    var dstImageData = dstCtx.createImageData(width, height);
    var dstData = dstImageData.data;
    //
    swapQuadrant(re, width, height);
    swapQuadrant(im, width, height);
    FFT.ifft2d(re, im);
    //
    var i = 0;
    for(var y = 0; y < height; y++) {
	for(var x = 0; x < width; x++) {
	    var o = i << 2;
	    var val = re[i++];
	    dstData[o++] = val;
	    dstData[o++] = val;
	    dstData[o++] = val;
	    dstData[o++] = 255;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function drawFrom2NCanvas(dst2NCanvas, dstCanvas) {
    var dstCtx = dstCanvas.getContext("2d");
    dstCtx.drawImage(dst2NCanvas, 0, 0, dst2NCanvas.width, dst2NCanvas.height,
		     0, 0, dstCanvas.width, dstCanvas.height);
}
