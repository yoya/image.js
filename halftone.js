"use strict";
/*
 * 2022/08/28- (c) yoya@awm.jp
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
	drawSrcImageAndHalftone(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeightRange":"maxWidthHeightText",
                   "scaleRange":"scaleText",
                   "sizeRange":"sizeText",
                   "rotateRange":"rotateText" },
		 function() {
		     drawSrcImageAndHalftone(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
}


function drawSrcImageAndHalftone(srcImage, srcCanvas, dstCanvas, params) {
    const scale = params.scaleRange;
    const maxWidthHeight = Math.round(params.maxWidthHeightRange / scale);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    rescaleCanvas(srcCanvas, scale);
    drawHalftone(srcCanvas, dstCanvas, params);
}

function quantizeRound(value, size) {
    return Math.round(value / size - 0.0000001) * size;
}

function quantizeCenter(x, y, size) {
    return [ quantizeRound(x, size), quantizeRound(y, size) ];
}

function averageArea(imageData, x, y, size) {
    return getRGBA(imageData, x, y, OUTFILL_EDGE);
}

function negateImage(canvas) {
    const width = canvas.width, height = canvas.height;
}

function rotateXY(x, y, width, height, angle) {
    const xx = x + width / 2;
    const yy = y + height / 2;
    const _cos = Math.cos(angle);
    const _sin = Math.sin(angle);
    const xxx = xx * _cos + yy * _sin;
    const yyy = -xx * _sin + yy * _cos;
    return [xxx - width / 2, yyy - height / 2 ];
}

function drawHalftone(srcCanvas, dstCanvas, params) {
    console.debug("drawHalftone");
    const size = params.sizeRange;
    const rotate = params.rotateRange / 180 * Math.PI;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const radius = size/2;
    const margin = (1.414 - 1.0 ) / 2;
    const widthHeightMax = Math.max(width, height)
    const xMin = - widthHeightMax * 2 - size;
    const xMax = widthHeightMax * 2+ size;
    const yMin = - widthHeightMax * 2 - size;
    const yMax = widthHeightMax * 2 + size;
    for (let y = yMin ; y < yMax; y += size) {
        for (let x = xMin; x < xMax; x += size) {
            const [ xx, yy ] = rotateXY(x, y, width, height, rotate);
            if ((xx < -size) || (width + size < xx) ||
                (yy < -size)  || (height + size < xx )) {
                continue;
            }
	    const rgba = averageArea(srcImageData,
                                     Math.round(xx), Math.round(yy), size);
            const hexColor = "#"+Utils.ToHexArray(rgba).join("");
            dstCtx.save();
            dstCtx.beginPath();
            dstCtx.fillStyle = hexColor;
            dstCtx.arc(xx, yy, radius, 0, Math.PI * 2, true);
            dstCtx.fill();
            dstCtx.restore();
	}
    }
    
}
