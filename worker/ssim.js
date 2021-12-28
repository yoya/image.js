"use strict";
/*
 * 2019/10/21- (c) yoya@awm.jp
 * 2019/10/22- (c) yoya@awm.jp WebWorker
 */

importScripts("../lib/color.js");
importScripts("../lib/statistics.js");
importScripts("../lib/canvas.js");

onmessage = function(e) {
    var srcImageData = e.data.image;
    var params = e.data;
    var [srcImageData1, srcImageData2] = srcImageData;
    var [dstImageData, data] = drawSSIM(srcImageData1, srcImageData2, params);
    postMessage({image:dstImageData, data:data},
                [dstImageData[0].data.buffer, dstImageData[1].data.buffer,
                 dstImageData[2].data.buffer, dstImageData[3].data.buffer]);
}    

// https://en.wikipedia.org/wiki/Structural_similarity
function localSSIM_Array(imageArr1, imageArr2, width, height,
                         c1, c2, c3, alpha, beta, gamma) {
    var n = width * height;
    console.assert(n === imageArr1.length);
    console.assert(n === imageArr2.length);
    //
    var mu_x = Statistics.average(imageArr1);
    var mu_y = Statistics.average(imageArr2);
    //
    var [sigma_x_2, sigma_y_2, sigma_xy] = Statistics.variance_covariance(imageArr1, imageArr2, mu_x, mu_y);
    var sigma_x = Math.sqrt(sigma_x_2);
    var sigma_y = Math.sqrt(sigma_y_2);
    // l: luminance
    var l = (2 * mu_x * mu_y + c1) / (mu_x**2 + mu_y**2 + c1)
    // c: contrast
    var c = (2 * sigma_x * sigma_y + c2) / (sigma_x**2 + sigma_y**2 + c2)    
    // s: structure
    var s = (sigma_xy + c3) / (sigma_x*sigma_y + c3)
    //
    var ssim = (l**alpha) * (c**beta) * (s**gamma);
    return [l, c, s, ssim];
}

function localSSIM_RGB(imageData1, imageData2, x1, y1, x2, y2,
                       c1, c2, c3, alpha, beta, gamma) {
    // return [[255, 0, 0], [255, 255, 0], [0, 255, 0], [0, 0, 255]];
    var width = x2 - x1 + 1, height = y2 - y1 + 1;
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
                var rgba1 = getRGBA(imageData1, x, y);
                var rgba2 = getRGBA(imageData2, x, y);
                var a = rgba1[3]/255; // alpha value (0.0-1.0)
                imageArr1[i] = rgba1[c];
                imageArr1[i] *= a;
                imageArr2[i] = rgba2[c];
                imageArr2[i] *= a;
                i++;
            }
        }
        [lArrRGB[c], cArrRGB[c], sArrRGB[c], ssimArrRGB[c]] = localSSIM_Array(
            imageArr1, imageArr2, width, height,
            c1, c2, c3, alpha, beta, gamma);
    }
    return [lArrRGB, cArrRGB, sArrRGB, ssimArrRGB];
}

function drawSSIM(srcImageData1, srcImageData2, params) {
    console.debug("drawSSIM:", params);
    var dstNormalize = params.dstNormalize;
    var windowSize = params.windowSize;
    var slideSize = params.slideSize;
    var k1 = params.k1, k2 = params.k2;
    var alpha = params.alpha, beta = params.beta, gamma = params.gamma;
    var L_max = 255; // max luminance (2^depth - 1)
    var c1 = (k1 * L_max) ** 2;
    var c2 = (k2 * L_max) ** 2;
    var c3 = c2 / 2;
    //
    var srcWidth1 = srcImageData1.width, srcHeight1 = srcImageData1.height;
    var srcWidth2 = srcImageData2.width, srcHeight2 = srcImageData2.height;
    var srcWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    var srcHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;
    //
    var dstWidth  =  Math.ceil((srcWidth  - windowSize + 1) / slideSize);
    var dstHeight =  Math.ceil((srcHeight - windowSize + 1) / slideSize);
    console.debug("dstWidth, dstHeight:", dstWidth, dstHeight);
    //
    var windowArea = windowSize * windowSize;
    //
    var lArr = new Float32Array(3 * dstWidth * dstHeight);
    var cArr = new Float32Array(3 * dstWidth * dstHeight);
    var sArr = new Float32Array(3 * dstWidth * dstHeight);
    var ssimArr = new Float32Array(3 * dstWidth * dstHeight);
    var i = 0;
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth ; dstX++) {
            var srcX1 = dstX*slideSize;
            var srcY1 = dstY*slideSize;
            var srcX2 = srcX1 + windowSize - 1;
            var srcY2 = srcY1 + windowSize - 1;
            if (srcX2 >= srcWidth) {
                srcX2 = srcWidth -1;
            }
            if (srcY2 >= srcHeight) {
                srcY2 = srcHeight -1;
            }
            var [lArrRGB, cArrRGB, sArrRGB, ssimRGB] =
                localSSIM_RGB(srcImageData1, srcImageData2,
                              srcX1, srcY1, srcX2, srcY2,
                              c1, c2, c3, alpha, beta, gamma);
            for (var c = 0 ; c < 3 ; c++) {
                lArr[i] = lArrRGB[c];
                cArr[i] = cArrRGB[c];
                sArr[i] = sArrRGB[c];
                ssimArr[i] = ssimRGB[c];
                i++;
            }
	}
    }
    console.assert(i === (3 * dstWidth * dstHeight));
    var dstImageDataL = new ImageData(dstWidth, dstHeight);
    var dstImageDataC = new ImageData(dstWidth, dstHeight);
    var dstImageDataS = new ImageData(dstWidth, dstHeight);
    var dstImageData = new ImageData(dstWidth, dstHeight);
    var lArr2, cArr2, sArr2, ssimArr2;
    if (dstNormalize) {
        lArr2 = Statistics.normalize(lArr, 255);
        cArr2 = Statistics.normalize(cArr, 255);
        sArr2 = Statistics.normalize(sArr, 255);
        ssimArr2 = Statistics.normalize(ssimArr, 255);
    } else {
        lArr2 = Statistics.multiply(lArr, 255);
        cArr2 = Statistics.multiply(cArr, 255);
        sArr2 = Statistics.multiply(sArr, 255);
        ssimArr2 = Statistics.multiply(ssimArr, 255);
    }
    CopyRGB2RGBA(lArr2, dstImageDataL.data);
    CopyRGB2RGBA(cArr2, dstImageDataC.data);
    CopyRGB2RGBA(sArr2, dstImageDataS.data);
    CopyRGB2RGBA(ssimArr2, dstImageData.data);
    return [[dstImageDataL, dstImageDataC, dstImageDataS, dstImageData],
            [lArr, cArr, sArr, ssimArr]];
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
