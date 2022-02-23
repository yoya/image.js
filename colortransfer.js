"use strict";
/*
 * 2022/02/13- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

jscolor.presets.default = { width:256, height:256 };

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const srcColorText = document.getElementById("srcColorText");
    const dstColorText = document.getElementById("dstColorText");
    const colorSrcDstRadio1 = document.getElementById("colorSrcDstRadio1");
    const colorSrcDstRadio2 = document.getElementById("colorSrcDstRadio2");
    const srcImage = new Image();
    const params = {};
    srcImage.onload = function() {
	drawSrcImageAndColorTransfer(srcImage, srcCanvas, dstCanvas, params);
    }
    srcImage.src = "./img/RGBCube.png"
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "fuzzRange":"fuzzText",
                  "srcColorText":null, "dstColorText":null,
                  "colorSrcDstRadio1":null, "colorSrcDstRadio2":null,
                  "diffSyncRange":"diffSyncText",
                  "diffRelativeRange":"diffRelativeText"},
		 function(target) {
                     switch (target.id) {
                     case "srcColorText":
                     case "colorSrcDstRadio1":
                         colorSrcDstRadio1.checked = true;
                         colorSrcDstRadio2.checked = false;
                         break;
                     case "dstColorText":
                     case "colorSrcDstRadio2":
                         colorSrcDstRadio1.checked = false;
                         colorSrcDstRadio2.checked = true;
                         break;
                     }
                     params.colorSrcDstRadio1 = colorSrcDstRadio1.checked;
                     params.colorSrcDstRadio2 = colorSrcDstRadio2.checked;
                     drawSrcImageAndColorTransfer(srcImage, srcCanvas, dstCanvas, params);
		 }, params);
    let touch = false;
    bindCursolFunction("srcCanvas", params, function(target, eventType) {
        switch (eventType) {
        case "mousedown":
            touch = true;
            break;
        case "mouseup":
        case "mouseenter":
        case "mouseleave":
            touch = false;
            break;
        }
        if (touch) {
            const {x, y} = params[target.id];
            const rgba = getCanvasRGBA(srcCanvas, x, y, OUTFILL_EDGE);
            const rgb = rgba.subarray(0, 3);
            if (params.colorSrcDstRadio1) {
                const colorText = Utils.ToHexArray(rgb).join("");
                params.srcColorText = colorText;
                srcColorText.jscolor.fromString(colorText);
            } else {
                const colorText = Utils.ToHexArray(rgb).join("");
                params.dstColorText = colorText;
                dstColorText.jscolor.fromString(colorText);
            }
            drawSrcImageAndColorTransfer(srcImage, srcCanvas, dstCanvas, params);
        }
    });
}

function getCanvasRGBA(canvas, x, y, outfill) {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return getRGBA(imageData, x, y, outfill);
}

function drawSrcImageAndColorTransfer(srcImage, srcCanvas, dstCanvas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorTransfer(srcCanvas, dstCanvas, params);
}

function drawColorTransfer(srcCanvas, dstCanvas, params) {
    // console.debug("drawColorTransfer", params);
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcColor = getRGBAfromHexColor(params.srcColorText);
    const dstColor = getRGBAfromHexColor(params.dstColorText);
    const fuzz = params.fuzzRange;
    const diffSync = params.diffSyncRange;
    const diffRelative = params.diffRelativeRange;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            const rgba = getRGBA(srcImageData, x, y);
            const diff = diffColor(rgba, srcColor);
            if (matchColor(diff, fuzz)) {
                const rgba2 = transferColor(srcColor, dstColor, diff,
                                            diffSync, diffRelative, rgba[3]);
	        setRGBA(dstImageData, x, y, rgba2);
            } else {
                setRGBA(dstImageData, x, y, rgba);
            }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

function diffColor(rgb, srcColor) {
    const [r1, g1, b1] = rgb;
    const [r2, g2, b2] = srcColor;
    return [r1 - r2, g1 - g2, b1 - b2];
}

function matchColor(diff, fuzz) {
    const dist = Math.sqrt(diff[0]**2 + diff[1]**2 + diff[2]**2);
    // 441.67295593006 ~= sqrt((255^2)*3)
    if ((dist / 441.67295593006) <= fuzz) {
        return true;
    }
    return false;
}

function transferColor(srcColor, dstColor, diff, diffSync, diffRelative, a) {
    const [r1, g1, b1] = dstColor;
    const [r2, g2 ,b2] = diff;
    if (diffRelative != 0) {  // [-1 ... 0 ... 1]
        const [r3, g3, b3] = srcColor;
        const ratio1 = (r1+g1+b1)/(r3+g3+b3) * (0.5 - diffRelative/2);
        const ratio2 = (r3+g3+b3)/(r1+g1+b1) * (0.5 + diffRelative/2);
        const ratio = ratio1 + ratio2;
        diffSync *= ratio;
    }
    const r = r1 + r2 * diffSync;
    const g = g1 + g2 * diffSync;
    const b = b1 + b2 * diffSync;
    return new Uint8ClampedArray([r, g, b, a]);
}
