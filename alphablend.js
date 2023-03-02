"use strict";
/*
 * 2017/04/27- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas1 = document.getElementById("srcCanvas1");
    const srcCanvas2 = document.getElementById("srcCanvas2");
    const srcCanvas1Container = document.getElementById("srcCanvas1Container");
    const srcCanvas2Container = document.getElementById("srcCanvas2Container");
    const dstCanvas = document.getElementById("dstCanvas");
    //
    const params = {};
    const srcImage1 = new Image();
    const srcImage2 = new Image();
    srcImage1.onload = function() {
	drawSrcImage(srcImage1, srcCanvas1, params.maxWidthHeightRange);
	drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, params, true);
    }
    srcImage2.onload = function() {
	drawSrcImage(srcImage2, srcCanvas2, params.maxWidthHeightRange);
	drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, params, true)
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
		  "ratio1Range":"ratio1Text", "ratio2Range":"ratio2Text",
                  "shiftXRange":"shiftXText", "shiftYRange":"shiftYText"},
		 function(target, rel) {
		     const maxWidthHeight = params.maxWidthHeightRange;
		     if ((target.id === "ratioRange") || (target.id === "ratioText")) {
			 const ratio = params.ratioRange;
                         params.ratio1Range = params.ratio1Text = 1 - ratio;
			 params.ratio2Range = params.ratio2Text = ratio;
                         bind2elements(params);
		     }
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, params,
				    rel);
		 }, params );
    bindFunction({"methodSelect":null},
		 function(target, rel) {
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, params,
				    true);
		 }, params );
}

const worker = new workerProcess("worker/alphablend.js");

function drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, params, sync) {
    // console.debug("drawAlphaBrend", params);
    const { methodSelect, linearGammaCheckbox, ratio1Range, ratio2Range,
            shiftXRange, shiftYRange } = params;
    const [shiftX, shiftY] = [shiftXRange, shiftYRange];
    const srcCtx1 = srcCanvas1.getContext("2d");
    const srcCtx2 = srcCanvas2.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const srcWidth1 = srcCanvas1.width, srcHeight1 = srcCanvas1.height;
    const srcWidth2 = srcCanvas2.width, srcHeight2 = srcCanvas2.height;
    const dstWidth  = (shiftX < 0)? Math.min(srcWidth1 + shiftX, srcWidth2):
          Math.min(srcWidth1, srcWidth2 - shiftX);
    const dstHeight = (shiftY < 0)? Math.min(srcHeight1 + shiftY, srcHeight2):
          Math.min(srcHeight1, srcHeight2 - shiftY);
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    const srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);
    //
    const params_w = {method:methodSelect, linearGamma:linearGammaCheckbox,
                      ratio1:ratio1Range, ratio2:ratio2Range, shiftX, shiftY};
    worker.process([srcCanvas1, srcCanvas2], dstCanvas, params_w, sync)
}
