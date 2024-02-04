"use strict";
/*
 * 2024/02/04- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("gravitylens.js::main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcImage = new Image();
    const params = { gravityPointer:null };
    srcImage.onload = function() {
	drawSrcImageAndGravityLens(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({ "maxWidthHeight":"maxWidthHeightText",
                   "amount":"amountText",
                   "scale":"scaleText"},
		 function() {
		     drawSrcImageAndGravityLens(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
    function cursolFunction(target, eventType) {
        const p = params[target.id];
        const { x, y, buttons } = p;
        if (buttons === 0) {
            params.gravityPointer = null;
        } else {
            params.gravityPointer = p;
        }
	drawSrcImageAndGravityLens(srcImage, srcCanvas, dstCanvas,
                                   params);
    }
    bindCursolFunction("srcCanvas", params, cursolFunction);
    bindCursolFunction("dstCanvas", params, cursolFunction);
}

function drawSrcImageAndGravityLens(srcImage, srcCanvas, dstCancas, params) {
    const { maxWidthHeight } = params;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawGravityLens(srcCanvas, dstCanvas, params);
}

function GravityLens(srcX, srcY, gravityX, gravityY, scale) {
    srcX *= scale;
    srcY *= scale;
    gravityX *= scale;
    gravityY *= scale;
    const distance = Math.sqrt((srcX - gravityX)**2 + (srcY - gravityY)**2);
    const dx = (srcX - gravityX) / distance;
    const dy = (srcY - gravityY) / distance;
    return [dx * scale, dy * scale];
}

function drawGravityLens(srcCanvas, dstCanvasm, params) {
    // console.debug("drawGravityLens");
    const { width, height } = srcCanvas;
    const { gravityPointer, amount, scale } = params;
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    if (gravityPointer) {
        for (let y = 0 ; y < height; y++) {
            for (let x = 0 ; x < width; x++) {
                const [dx, dy] = GravityLens(x, y, gravityPointer.x, gravityPointer.y, scale);
                const x2 = x + (amount * dx) | 0;
                const y2 = y + (amount * dy) | 0;
	        const rgba = getRGBA(srcImageData, x2, y2);
	        setRGBA(dstImageData, x, y, rgba);
	    }
        }
    } else {
        dstImageData.data.set(srcImageData.data);
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
