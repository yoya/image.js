"use strict";
/*
 * 2017/04/27- (c) yoya@awm.jp
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
    var dstCanvas = document.getElementById("dstCanvas");
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value)
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    var ratioRange  = document.getElementById("ratioRange");
    var ratio1Range = document.getElementById("ratio1Range");
    var ratio2Range = document.getElementById("ratio2Range");
    var ratioText  = document.getElementById("ratioText");
    var ratio1Text = document.getElementById("ratio1Text");
    var ratio2Text = document.getElementById("ratio2Text");
    //
    var srcImage1 = new Image();
    var srcImage2 = new Image();
    srcImage1.onload = function() {
	drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas);
    }
    srcImage2.onload = function() {
	drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
		       linearGamma, true);
    }
    srcImage1.src = "img/4x4primary-400x400.png";
    srcImage2.src = "img/RGBCube.png";
    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1.src = dataURL;
    }, "DataURL");
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2.src = dataURL;
    }, "DataURL");
    
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearGammaCheckbox":null,
		  "ratioRange":"ratioText",
		  "ratio1Range":"ratio1Text",
		  "ratio2Range":"ratio2Text"},
		 function(target, rel) {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     linearGamma = document.getElementById("linearGammaCheckbox").checked;
		     if ((target.id === "ratioRange") || (target.id === "ratioText")) {
			 var ratio = parseFloat(ratioRange.value);
			 ratio1Range.value = ratio1Text.value = 1 - ratio;
			 ratio2Range.value = ratio2Text.value = ratio;
		     }
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
				    linearGamma, rel);
		 } );
    bindFunction({"methodSelect":null},
		 function(target, rel) {
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas,
				    linearGamma, true);
		 } );
}

var  worker = new workerProcess("worker/alphablend.js");

function drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, linearGamma, sync) {
    // console.debug("drawAlphaBrend")
    var method = document.getElementById("methodSelect").value;
    var ratio1 = parseFloat(document.getElementById("ratio1Range").value);
    var ratio2 = parseFloat(document.getElementById("ratio2Range").value);
    var srcCtx1 = srcCanvas1.getContext("2d");
    var srcCtx2 = srcCanvas2.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth1 = srcCanvas1.width, srcHeight1 = srcCanvas1.height;
    var srcWidth2 = srcCanvas2.width, srcHeight2 = srcCanvas2.height;
    var dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    var dstHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    var srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);
    //
    var params = {method:method, ratio1:ratio1, ratio2:ratio2,
		  linearGamma:linearGamma};
    worker.process([srcCanvas1, srcCanvas2], dstCanvas, params, sync)
}
