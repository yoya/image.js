"use strict";
/*
 * 2017/10/14- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});


function main() {
    // console.debug("main");
    var srcCanvas1 = document.getElementById("srcCanvas1");
    var srcCanvas2 = document.getElementById("srcCanvas2");
    var srcCanvas1Container = document.getElementById("srcCanvas1Container");
    var srcCanvas2Container = document.getElementById("srcCanvas2Container");
    var dstCanvasL = document.getElementById("dstCanvasL");
    var dstCanvasC = document.getElementById("dstCanvasC");
    var dstCanvasS = document.getElementById("dstCanvasS");
    var dstCanvas = document.getElementById("dstCanvas");
    var windowSize = 8;
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcImage1 = null;
    var srcImage2 = null;
    
    dropFunction(document.body, function(dataURL) {
	// nothing to do
    }, "DataURL");
    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	    drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas);
	}
	srcImage1.src = dataURL;
    }, "DataURL");
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	    drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas);
	}
	srcImage2.src = dataURL;
    }, "DataURL");
    
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas);
		 } );
}

// https://en.wikipedia.org/wiki/Structural_similarity
function localSSIM_Array(imageArr1, imageArr2, width, height,
                         c1, c2, c3, alpha, beta, gamma) {
    var n = width * height;
    //
    var mu_x = 0, mu_y = 0;
    for (var i = 0 ; i < n ; i++) {
        mu_x += imageArr1[i];
        mu_y += imageArr2[i];
    }
    mu_x /= width * height;
    mu_y /= width * height;
    //
    var sigma_x = 0, sigma_y = 0; // standard deviation
    var sigma_xy = 0;             // covariance
    for (var i = 0 ; i < n ; i++) {
        var v1 = imageArr1[i];
        var v2 = imageArr2[i];
        sigma_x += (v1 - mu_x)**2;
        sigma_y += (v2 - mu_y)**2;
        sigma_xy += (v1 - mu_x) * (v2 - mu_y);
    }
    sigma_x = Math.sqrt(sigma_x / (width * height))
    sigma_y = Math.sqrt(sigma_y / (width * height))
    sigma_xy /= width * height;
    // l: luminance
    var l = (2 * mu_x * mu_y + c1) / (mu_x**2 + mu_y**2 + c1)
    // c: contrast
    var c = (2 * sigma_x * sigma_y + c2) / (sigma_x**2 + sigma_y**2 + c2)    
    // s: structure
    var s = (sigma_xy + c3) / (sigma_x*sigma_y + c3)
    //
    var ssim = l**alpha * c**beta ** s**gamma;
    return [l, c, s, ssim];
}

function localSSIM_RGB(imageData1, imageData2, x1, y1, x2, y2,
                       k1, k2, alpha, beta, gamma) {
    // return [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 0, 255]];
    var srcCtx1 = srcCanvas1.getContext("2d");
    var srcCtx2 = srcCanvas2.getContext("2d");
    var width = x2 - x1 + 1, height = y2 - y1 + 1;
    var L_max = 255; // max luminance (2^depth - 1)
    //
    var c1 = (k1 * L_max) ** 2;
    var c2 = (k2 * L_max) ** 2;
    var c3 = c2 / 2;
    //
    var lArrRGB = new Float32Array(3);
    var cArrRGB = new Float32Array(3);
    var sArrRGB = new Float32Array(3);
    var ssimArrRGB = new Float32Array(3);
//
    var imageArr1 = new Float32Array(width * height);
    var imageArr2 = new Float32Array(width * height);
    for (var c = 0 ; c < 3 ; c++) {
        var i = 0;
        for (var y = y1 ; y <= y2 ; y++) {
            for (var x = x1 ; x <= x2 ; x++) {
                var rgba1 = getRGBA(imageData1, x, y)
                var rgba2 = getRGBA(imageData2, x, y)
                imageArr1[i] = rgba1[c];
                imageArr1[i] *= rgba1[3]/255;
                imageArr2[i] = rgba2[c];
                imageArr2[i] *= rgba2[3]/255;
                i++;
            }
        }
        [lArrRGB[c], cArrRGB[c], sArrRGB[c], ssimArrRGB[c]] = localSSIM_Array(
            imageArr1, imageArr2, width, height,
            c1, c2, c3, alpha, beta, gamma);
    }
    return [lArrRGB, cArrRGB, sArrRGB, ssimArrRGB];
}

function drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas) {
    var windowSize = 8;
    var k1 = 0.01, k2 = 0.03;
    var alpha = 1, beta = 1, gamma = 1;
    //
    var srcCtx1 = srcCanvas1.getContext("2d");
    var srcCtx2 = srcCanvas2.getContext("2d");
    var dstCtxL = dstCanvasL.getContext("2d");
    var dstCtxC = dstCanvasC.getContext("2d");
    var dstCtxS = dstCanvasS.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth1 = srcCanvas1.width, srcHeight1 = srcCanvas1.height;
    var srcWidth2 = srcCanvas2.width, srcHeight2 = srcCanvas2.height;
    var srcWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    var srcHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;
    //
    var dstWidth  =  srcWidth  - (windowSize - 1);
    var dstHeight =  srcHeight - (windowSize - 1);
    var srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    var srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);
    dstCanvasL.width  = dstWidth;
    dstCanvasL.height = dstHeight;
    dstCanvasC.width  = dstWidth;
    dstCanvasC.height = dstHeight;
    dstCanvasS.width  = dstWidth;
    dstCanvasS.height = dstHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var windowSize = 8;
    var windowArea = windowSize * windowSize;
    //
    var lArr = new Float32Array(3 * dstWidth * dstHeight);
    var cArr = new Float32Array(3 * dstWidth * dstHeight);
    var sArr = new Float32Array(3 * dstWidth * dstHeight);
    var ssimArr = new Float32Array(3 * dstWidth * dstHeight);
    var i = 0;
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth ; dstX++) {
            var [lArrRGB, cArrRGB, sArrRGB, ssimRGB] =
                localSSIM_RGB(srcImageData1, srcImageData2, dstX, dstY,
                              dstX + windowSize - 1, dstY + windowSize - 1,
                              k1, k2, alpha, beta, gamma);
            for (var c = 0 ; c < 3 ; c++) {
                lArr[i]  = lArrRGB[c];
                cArr[i] = cArrRGB[c];
                sArr[i] = sArrRGB[c];
                ssimArr[i] = ssimRGB[c];
                i++;
            }
	}
    }
    var dstImageDataL = new ImageData(dstWidth, dstHeight);
    var dstImageDataC = new ImageData(dstWidth, dstHeight);
    var dstImageDataS = new ImageData(dstWidth, dstHeight);
    var dstImageData = new ImageData(dstWidth, dstHeight);
    Normalize(lArr, 255);
    Normalize(cArr, 255);
    Normalize(sArr, 255);
    Normalize(ssimArr, 255);
    CopyRGB2RGBA(lArr, dstImageDataL.data);
    CopyRGB2RGBA(cArr, dstImageDataC.data);
    CopyRGB2RGBA(sArr, dstImageDataS.data);
    CopyRGB2RGBA(ssimArr, dstImageData.data);
    dstCtxL.putImageData(dstImageDataL, 0, 0);
    dstCtxC.putImageData(dstImageDataC, 0, 0);
    dstCtxS.putImageData(dstImageDataS, 0, 0);
    dstCtx.putImageData(dstImageData, 0, 0);
}

function Normalize(arr, max) {
    var n = arr.length;
    var real_max = 0;
    for (var i = 0 ; i < n ; i++) {
        if (real_max < arr[i]) {
            real_max = arr[i];
        }
    }
    var a = max / real_max;
    for (var i = 0 ; i < n ; i++) {
        arr[i] *= a;
    }
    return arr;
}

function CopyRGB2RGBA(arr1, arr2) {
    var n = arr1.length;
    var i = 0, i2 = 0;
    while (i < n) {
        arr2[i2++] = arr1[i++];
        arr2[i2++] = arr1[i++];
        arr2[i2++] = arr1[i++];
        arr2[i2++] = 255;
    }
}
