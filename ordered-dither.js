"use strict";
/*
 * 2023/03/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const matrixCanvas = document.getElementById("matrixCanvas");
    const srcCanvas = document.getElementById("srcCanvas");
    const halftoneCanvas = document.getElementById("halftoneCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcImage = new Image();
    const params = {};
    srcImage.onload = function() {
	drawSrcImageAndDither(srcImage, matrixCanvas, srcCanvas,
                              halftoneCanvas, dstCanvas, params);
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
		     drawSrcImageAndDither(srcImage, matrixCanvas, srcCanvas,
                                           halftoneCanvas, dstCanvas, params);
		 }, params);
}

function drawSrcImageAndDither(srcImage, matrixCanvas, srcCanvas,
                               halftoneCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawDither(matrixCanvas, srcCanvas, halftoneCanvas, dstCanvas, params);
}

const DitherThresholdTable = {
    "threshold":{ width:1, height:1, divisor:2,
                  levels:[ 1 ]
                },
    "checks":{ width:2, height:2, divisor:3,
               levels:[ 1, 2,
                        2, 1 ],
             },
    // (dispersed) Ordered Dither Patterns
    "o2x2":{ width:2, height:2, divisor:5,
             levels:[ 1, 3,
                      4, 2 ],
           },
    "o3x3":{ width:3, height:3, divisor:10,
             levels:[ 3, 7, 4,
                      6, 1, 9,
                      2, 8, 5 ],
           },
    // From "Dithering Algorithms"
    // http://www.efg2.com/Lab/Library/ImageProcessing/DHALF.TXT
    // http://web.archive.org/web/20190601182248/http://www.efg2.com/Lab/Library/ImageProcessing/DHALF.TXT
    "o4x4":{ width:4, height:4, divisor:17,
             levels:[ 1 ,  9,  3, 11,
                      13,  5, 15,  7,
                      4 , 12,  2, 10,
                      16,  8, 14, 6 ],
           },
    // Halftones - Angled 45 degrees
    "h4x4a":{ width:4, height:4, divisor:9,
              levels:[ 4, 2, 7, 5,
                       3, 1, 8, 6,
                       7, 5, 4, 2,
                       8, 6, 3, 1 ],
           },
    "h6x6a":{ width:6, height:6, divisor:19,
              levels:[ 14, 13, 10,  8,  2,  3,
                       16, 18, 12,  7,  1,  4,
                       15, 17, 11,  9,  6,  5,
                       8,   2,  3, 14, 13, 10,
                       7,   1,  4, 16, 18, 12,
                       9,   6,  5, 15, 17, 11 ],
            },
    "h8x8a":{ width:8, height:8, divisor:33,
              levels:[ 13,  7,  8, 14, 17, 21, 22, 18,
                       6,   1,  3,  9, 28, 31, 29, 23,
                       5,   2,  4, 10, 27, 32, 30, 24,
                       16, 12, 11, 15, 20, 26, 25, 19,
                       17, 21, 22, 18, 13,  7,  8, 14,
                       28, 31, 29, 23,  6,  1,  3,  9,
                       27, 32, 30, 24,  5,  2,  4, 10,
                       20, 26, 25, 19, 16, 12, 11, 15 ],
            },
    // Halftones - Orthogonally Aligned, or Un-angled
    "h4x4o":{ width:4, height:4, divisor:17,
              levels:[ 7,  13, 11,  4,
                       12, 16, 14,  8,
                       10, 15,  6,  2,
                       5,   9,  3,  1],
           },
    "h6x6o":{ width:6, height:6, divisor:37,
              levels:[ 7,  17, 27, 14,  9,  4,
                       21, 29, 33, 31, 18, 11,
                       24, 32, 36, 34, 25, 22,
                       19, 30, 35, 28, 20, 10,
                       8,  15, 26, 16,  6,  2,
                       5,  13, 23, 12,  3,  1],
            },
    "h8x8o":{ width:8, height:8, divisor:65,
              levels:[ 7,  21, 33, 43, 36, 19,  9,  4,
                       16, 27, 51, 55, 49, 29, 14, 11,
                       31, 47, 57, 61, 59, 45, 35, 23,
                       41, 53, 60, 64, 62, 52, 40, 38,
                       37, 44, 58, 63, 56, 46, 30, 22,
                       15, 28, 48, 54, 50, 26, 17, 10,
                       8,  18, 34, 42, 32, 20,  6,  2,
                       5,  13, 25, 39, 24, 12,  3,  1 ],
            },
    //  Direct extract from "Dithering & Halftoning" by Gernot Haffmann.
    "h16x16o":{ width:16, height:16, divisor:257, levels:[
        4,    12,  24,  44,  72, 100, 136, 152, 150, 134,  98,  70,  42,  23,  11,   3,
        7,    16,  32,  52,  76, 104, 144, 160, 158, 142, 102,  74,  50,  31,  15,   6,
        19,   27,  40,  60,  92, 132, 168, 180, 178, 166, 130,  90,  58,  39,  26,  18,
        36,   48,  56,  80, 124, 176, 188, 204, 203, 187, 175, 122,  79,  55,  47,  35,
        64,   68,  84, 116, 164, 200, 212, 224, 223, 211, 199, 162, 114,  83,  67,  63,
        88,   96, 112, 156, 192, 216, 232, 240, 239, 231, 214, 190, 154, 111,  95,  87,
        108, 120, 148, 184, 208, 228, 244, 252, 251, 243, 226, 206, 182, 147, 119, 107,
        128, 140, 172, 196, 219, 235, 247, 256, 255, 246, 234, 218, 194, 171, 139, 127,
        126, 138, 170, 195, 220, 236, 248, 253, 254, 245, 233, 217, 193, 169, 137, 125,
        106, 118, 146, 183, 207, 227, 242, 249, 250, 241, 225, 205, 181, 145, 117, 105,
        86,   94, 110, 155, 191, 215, 229, 238, 237, 230, 213, 189, 153, 109,  93,  85,
        62,   66,  82, 115, 163, 198, 210, 221, 222, 209, 197, 161, 113,  81,  65,  61,
        34,   46,  54,  78, 123, 174, 186, 202, 201, 185, 173, 121,  77,  53,  45,  33,
        20,   28,  37,  59,  91, 131, 167, 179, 177, 165, 129,  89,  57,  38,  25,  17,
        8,    13,  29,  51,  75, 103, 143, 159, 157, 141, 101,  73,  49,  30,  14,   5,
        1,     9,  21,  43,  71,  99, 135, 151, 149, 133,  97,  69,  41,  22,  10,   2
    ],
                
              },
    // Halftones - Orthogonally Expanding Circle Patterns
    "c5x5b":{ width:5, height:5, divisor:26,
              levels:[ 1, 21, 16, 15,  4,
                       5, 17, 20, 19, 14,
                       6, 21, 25, 24, 12,
                       7, 18, 22, 23, 11,
                       2,  8,  9, 10,  3],
            },
    "c5x5w":{ width:5, height:5, divisor:26,
              levels:[ 25, 21, 10, 11, 22,
                       20,  9,  6,  7, 12,
                       19,  5,  1,  2, 13,
                       18,  8,  4,  3, 14,
                       24, 17, 16, 15, 23],
            },

    "c6x6b":{ width:6, height:6, divisor:37,
              levels:[ 1,   5, 14, 13, 12,  4,
                       6,  22, 28, 27, 21, 11,
                       15, 29, 35, 34, 26, 20,
                       16, 30, 36, 33, 25, 19,
                       7,  23, 31, 32, 24, 10,
                       2,   8, 17, 18,  9,  3],
            },
    "c6x6w":{ width:6, height:6, divisor:37,
              levels:[ 36, 32, 23, 24, 25, 33,
                       31, 15,  9, 10, 16, 26,
                       22,  8,  2,  3, 11, 17,
                       21,  7,  1,  4, 12, 18,
                       30, 14,  6,  5, 13, 27,
                       35, 29, 20, 19, 28, 34],
            },
    "c7x7b":{ width:7, height:7, divisor:50,
              levels:[ 3,   9, 18, 28, 17,  8,  2,
                       10, 24, 33, 39, 32, 23,  7,
                       19, 34, 44, 48, 43, 31, 16,
                       25, 40, 45, 49, 47, 38, 27,
                       20, 35, 41, 46, 42, 29, 15,
                       11, 21, 36, 37, 28, 22,  6,
                       4,  12, 13, 26, 14,  5,  1],
            },
    "c7x7w":{ width:7, height:7, divisor:50,
              levels:[ 47, 41, 32, 22, 33, 42, 48,
                       40, 26, 17, 11, 18, 27, 43,
                       31, 16,  6,  2,  7, 19, 34,
                       25, 10,  5,  1,  3, 12, 23,
                       30, 15,  9,  4,  8, 20, 35,
                       39, 29, 14, 13, 21, 28, 44,
                       46, 38, 37, 24, 36, 45, 49],
            },
};

function drawDither(matrixCanvas, srcCanvas, halftoneCanvas, dstCanvas, params) {
    // console.debug("drawDither");
    const { thresholdSelect, scaleRange,
            level0Select, level1Select, level2Select } = params;
    const matrixCtx = matrixCanvas.getContext("2d");
    const srcCtx = srcCanvas.getContext("2d");
    const halftoneCtx = halftoneCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const { width, height } = srcCanvas;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const map = DitherThresholdTable[thresholdSelect];
    const qrange = 255;
    const qscale = 1 / 255;
    matrixCanvas.width  = map.width;
    matrixCanvas.height = map.height;
    const matrixImageData = matrixCtx.createImageData(map.width, map.height);
    for (let y = 0 ; y < map.height; y++) {
        for (let x = 0 ; x < map.width; x++) {
            const m = map.levels[((x % map.width) +
                                  map.width * (y % map.height))];
            const v = m / map.divisor * 255;
            const o = 4 * (x + map.width * y);
            const d = matrixImageData.data;
            d[o + 0] = d[o + 1] = d[o + 2] = v;
            d[o + 3] = 255;
        }
    }
    matrixCtx.putImageData(matrixImageData, 0, 0);
    rescaleCanvas(matrixCanvas, 10);
    halftoneCanvas.width  = width;
    halftoneCanvas.height = height;
    const halftoneImageData = halftoneCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            const m = map.levels[((x % map.width) +
                                  map.width * (y % map.height))];
            const v = m / map.divisor * 255;
            const o = 4 * (x + width * y);
            const d = halftoneImageData.data;
            d[o + 0] = d[o + 1] = d[o + 2] = v;
            d[o + 3] = 255;
        }
    }
    halftoneCtx.putImageData(halftoneImageData, 0, 0);
    rescaleCanvas(halftoneCanvas, scaleRange);
    const levels = [ level0Select, level1Select, level2Select ];
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
    rescaleCanvas(dstCanvas, scaleRange);
}
