"use strict";
/*
 * 2023/03/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcImage = new Image();
    const params = {};
    srcImage.onload = function() {
	drawSrcImageAndDither(srcImage, srcCanvas, dstCanvas, params);
    }
    //    srcImage.src = "./img/RGBCube.png"
    srcImage.src = "./img/grad-white-magenta.png";
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeightRange":"maxWidthHeightText",
                   "scaleRange":"scaleText",
                   "thresholdSelect":null,
                   "level0Select":null,
                   "level1Select":null,
                   "level2Select":null },
		 function() {
		     drawSrcImageAndDither(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}

function drawSrcImageAndDither(srcImage, srcCanvas, dstCancas, params) {
    const { scaleRange } = params;
    drawSrcImage(srcImage, srcCanvas, params.maxWidthHeight);
    drawDither(srcCanvas, dstCanvas, params);
    rescaleCanvas(dstCanvas, scaleRange);
}

const DitherThresholdTable = {
    "threshold":{ width:1, height:1, divisor:2,
                  levels:[ 1 ]
                },
    "checks":{ width:2, height:2, divisor:3,
               levels:[ 1, 2,
                        2, 1 ],
             },
    "o2x2":{ width:2, height:2, divisor:5,
             levels:[ 1, 3,
                      4, 2 ],
           },
    "o3x3":{ width:3, height:3, divisor:10,
             levels:[ 3, 7, 4,
                      6, 1, 9,
                      2, 8, 5 ],
           },
    "o4x4":{ width:4, height:4, divisor:17,
             levels:[ 1 ,  9,  3, 11,
                      13,  5, 15,  7,
                      4 , 12,  2, 10,
                      16,  8, 14, 6 ],
           },
};

function drawDither(srcCanvas, dstCanvas, params) {
    // console.debug("drawDither");
    const { thresholdSelect,
            level0Select, level1Select, level2Select } = params;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const { width, height } = srcCanvas;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const map = DitherThresholdTable[thresholdSelect];
    const levels = [ level0Select, level1Select, level2Select ];
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const qrange = 255;
    const qscale = 1 / 255;
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const rgba = getRGBA(srcImageData, x, y);
            for (let c = 0; c < 3; c++) {
                let th = (qscale * rgba[c] * ((levels[c] *
                                               (map.divisor-1) ) + 1) ) | 0;
                const level = (th / (map.divisor-1)) | 0;
                th -= level * (map.divisor-1);
                const m = map.levels[((x % map.width) +
                                      map.width * (y % map.height))];
                rgba[c] = (level + ((th >= m)? 1: 0)) * qrange / levels[c];
            }
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
