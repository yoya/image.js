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
                   "cRotateRange":"cRotateText", "mRotateRange":"mRotateText",
                   "yRotateRange":"yRotateText", "kRotateRange":"kRotateText" ,
                   "cAmountRange":"cAmountText", "mAmountRange":"mAmountText",
                   "yAmountRange":"yAmountText", "kAmountRange":"kAmountText"
                 },
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

function negateCanvas(canvas) {
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.globalCompositeOperation='difference';
    ctx.fillStyle = "white";
    ctx.globalAlpha = 1;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function copyAlphaCanvas(srcCanvas, dstCanvas) {
    const {width, height} = srcCanvas;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.getImageData(0, 0, width, height);
    for (let i = 3; i < width * height * 4; i += 4) {
        dstImageData.data[i] = srcImageData.data[i];
    }
    dstCtx.putImageData(dstImageData, 0, 0);
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
    const rotate = [params.cRotateRange, params.mRotateRange, params.yRotateRange, params.kRotateRange].map(v => { return (v%90) / 180 * Math.PI });
    const amount = [params.cAmountRange, params.mAmountRange, params.yAmountRange, params.kAmountRange].map(v => { return v / 100; });
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    //const radius = size / 2;
    const radius = size / 1.5;
    //const radius = size * 1.414;
    const widthHeightMax = Math.max(width, height)
    const xMin = - widthHeightMax * 2 - size;
    const xMax = widthHeightMax * 2+ size;
    const yMin = - widthHeightMax * 2 - size;
    const yMax = widthHeightMax * 2 + size;
    dstCtx.save();
    dstCtx.globalCompositeOperation = "lighter";
    for (let c = 0; c < 4; c += 1) {
        for (let y = yMin ; y < yMax; y += size) {
            for (let x = xMin; x < xMax; x += size) {
                const [ x2, y2 ] = rotateXY(x, y, width, height, rotate[c]);
                if ((x2 < -size) || (width + size < x2) ||
                    (y2 < -size)  || (height + size < x2 )) {
                    continue;
                }
	        const rgba = getRGBA(srcImageData,
                                     Math.round(x2), Math.round(y2), OUTFILL_EDGE);
                const cmyk = RGB2CMYK(rgba);
                const intent = cmyk[c] / 255 * rgba[3] / 255 * amount[c];
                const grad = dstCtx.createRadialGradient(x2, y2, 0,
                                                         x2, y2, intent * radius);
                switch (c) {
                case 0:  // C
                    grad.addColorStop(0.4, "#FF0000");
                    grad.addColorStop(0.7, "#800000");
                    grad.addColorStop(1, "#000000");
                    break;
                case 1:  // M
                    grad.addColorStop(0.4, "#00FF00");
                    grad.addColorStop(0.7, "#008000");
                    grad.addColorStop(1, "#000000");

                    break;
                case 2:  // Y
                    grad.addColorStop(0.4, "#0000FF");
                    grad.addColorStop(0.7, "#000080");
                    grad.addColorStop(1, "#000000");
                    break;
                case 3:  // K
                    grad.addColorStop(0.4, "#FFFFFF");
                    grad.addColorStop(0.7, "#808080");
                    grad.addColorStop(1, "#000000");
                    break;
                }
                dstCtx.save();
                dstCtx.beginPath();
                dstCtx.fillStyle = grad;
                dstCtx.arc(x2, y2, intent * radius, 0, Math.PI * 2, true);
                dstCtx.fill();
                dstCtx.restore();
	    }
        }
    }
    dstCtx.restore();
    negateCanvas(dstCanvas);
    copyAlphaCanvas(srcCanvas, dstCanvas);
}
