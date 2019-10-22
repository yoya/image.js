"use strict";
/*
 * 2019/10/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function mean(arr) {
    var n = arr.length;
    var mu = 0;
    for (var i = 0 ; i < n ; i++) {
        mu += arr[i];
    }
    var precision = 1000000;
    return Math.round(mu / n * precision) / precision;
}


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
    var luminanceSpan = document.getElementById("luminanceSpan");
    var contrastSpan = document.getElementById("contrastSpan");
    var structureSpan = document.getElementById("structureSpan");
    var ssimSpan = document.getElementById("ssimSpan");
    //
    var params = {
        windowSize:8,
        slideSize:8,
        k1:0.01, k2: 0.03,
        alpha:1, beta:1, gamma:1
    };
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcImage1 = null;
    var srcImage2 = null;
    var displayValues = function(luminance, contrast, structure, ssim) {
        luminanceSpan.innerText = luminance;
        contrastSpan.innerText = contrast;
        structureSpan.innerText = structure;
        ssimSpan.innerText = ssim;
    }
    var callback = function(imagedata, data) {
        console.log("callback:", data.data);
        var [lArr, cArr, sArr, ssimArr] = data.data;
        displayValues(mean(lArr), mean(cArr), mean(sArr), mean(ssimArr));
    }
    dropFunction(document.body, function(dataURL) {
	// nothing to do
    }, "DataURL");
    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
            displayValues("-", "-", "-", "-");
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
            if (srcImage1 && srcImage2) {
	        drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas, params, callback, true);
            }
	}
	srcImage1.src = dataURL;
    }, "DataURL");
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
            displayValues("-", "-", "-", "-");
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
            if (srcImage1 && srcImage2) {
	        drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas, params, callback, true);
            }
	}
	srcImage2.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
                     displayValues("-", "-", "-", "-");
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
                     if (srcImage1) {
                         drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
                     }
                     if (srcImage2) {
                         drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
                     }
                     if (srcImage1 && srcImage2) {
		         drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas, params, callback, false);
                     }
		 } );
}

var worker = new workerProcess("worker/ssim.js");

function drawSSIM(srcCanvas1, srcCanvas2, dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas, params, callback, sync) {
    var srcCanvas = [srcCanvas1, srcCanvas2];
    var dstCanvas = [dstCanvasL, dstCanvasC, dstCanvasS, dstCanvas];
    worker.addListener(callback);
    worker.process(srcCanvas, dstCanvas, params, sync);
}
