"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcImage = new Image();
  const params = {
    unitsize: 8,
  };
    srcImage.onload = function() {
	drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ },
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas, params) {
  drawSrcImage(srcImage, srcCanvas);
  drawCopy(srcCanvas, dstCanvas, params);
}

function drawCopy(srcCanvas, dstCanvas, params) {
    // console.debug("drawCopy");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
      for (let x = 0 ; x < width; x++) {
	const xu = (x / params.unitsize) | 0;
	const yu = (y / params.unitsize) | 0;
	const rgba = getRGBA(srcImageData, x, y);
	if ((xu%2) == (yu%2)) {
	  if (rgba[0] < 200) {
	    rgba[0] += 100;
	  } else {
	    rgba[1] -= 100;
	    rgba[2] -= 100;
	  }
	} else {
	  if (rgba[1] < 200) {
	    rgba[1] += 50;
	  } else {
	    rgba[0] -= 50;
	    rgba[2] -= 50;
	  }
	}
	setRGBA(dstImageData, x, y, rgba);
      }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
