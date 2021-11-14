"use strict";
/*
 * 2021/11/13 (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function params2element(params) {
    for (let k in params) {
        const elem = document.getElementById(k);
        if (! elem) {
            // console.error(k+" elem is null");
            continue;
        }
        if ('checked' in elem) {
            elem.checked = params[k];
        } else if ('value' in elem) {
            elem.value = params[k];
        } else {
            console.error(k+" elem has no value");
        }
    }
}

function toOrientation(horizontal, vertical, diagonal) {
    const orientation = 1 +
          horizontal + (vertical << 1) + (diagonal << 2);
    return orientation;
}

function fromOrientation(orientation) {
    const vertical = (orientation - 1) & 1;
    const horizontal =  (orientation - 1) & 2;
    const diagonal = (orientation - 1) & 4;
    return [!!vertical, !!horizontal, !!diagonal];
}

function rotateOrientation(orientation, degree) {
    let [vertical, horizontal, diagonal] = fromOrientation(orientation);
    const mirror = vertical ^ horizontal ^ diagonal;
    /*
      * rotate 90
     * {diag,hori,vert}: 1:{000} => 6:{101} => 4:{011} => 7:{110}
     * {diag,hori,vert}: 5:{100} => 3:{010} => 8:{111} => 2:{001}
     */
    if ((degree === 90) ^ mirror) {
        [vertical, horizontal] = [!horizontal, vertical];
    } else {
        [vertical, horizontal] = [horizontal, !vertical];
    }
    diagonal = ! diagonal;
    return toOrientation(vertical, horizontal, diagonal);
}

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    const params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndOrientation(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "guideCheckbox":null
                 }, function(target) {
		     drawSrcImageAndOrientation(srcImage, srcCanvas, dstCanvas,
                                         params);
		 }, params);
    bindFunction({"orientationSelect":null,
                  "verticalCheckbox":null,
                  "horizontalCheckbox":null,
                  "diagonalCheckbox":null,
                  "rotate90Button":null,
                  "rotate270Button":null
                 }, function(target) {
                     if ((target.id === "orientationSelect") ||
                         (target.id === "rotate90Button") ||
                         (target.id === "rotate270Button")) {
                         let orientation = params.orientationSelect;
                         if (target.id === "rotate90Button") {
                             orientation = rotateOrientation(orientation, 90);
                             params.orientationSelect = orientation;
                         } else if (target.id === "rotate270Button") {
                             orientation = rotateOrientation(orientation, 270);
                             params.orientationSelect = orientation;
                         }
                         const [vertical, horizontal, diagonal] = fromOrientation(orientation);
                         params.verticalCheckbox = vertical;
                         params.horizontalCheckbox = horizontal;
                         params.diagonalCheckbox = diagonal;
                     } else {
                         const vertical = params.verticalCheckbox;
                         const horizontal = params.horizontalCheckbox;
                         const diagonal = params.diagonalCheckbox;
                         const orientation = toOrientation(vertical, horizontal, diagonal);
                         params.orientationSelect = orientation;
                     }
                     params2element(params);
		     drawSrcImageAndOrientation(srcImage, srcCanvas, dstCanvas,
                                                params);
		 }, params);
}

function drawSrcImageAndOrientation(srcImage, srcCanvas, dstCancas, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawOrientation(srcCanvas, dstCanvas, params);
}

function drawOrientation(srcCanvas, dstCanvas, params) {
    // console.debug("drawOrientation");
    const orientation = params.orientationSelect;
    const [vertical, horizontal, diagonal] = fromOrientation(orientation);
    const guide = params.guideCheckbox;
    //
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    const dstWidth = diagonal? height: width;
    const dstHeight = diagonal? width:height;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.getImageData(0, 0, dstWidth, dstHeight);
    const srcData = new Uint32Array(srcImageData.data.buffer);
    const dstData = new Uint32Array(dstImageData.data.buffer);
    const n = srcData.length;
    //
    let startx = horizontal? (width - 1): 0;
    let dx = horizontal? -1: 1;
    let starty = vertical? (height - 1): 0;
    let dy = vertical? -1: 1;

    let yy = starty;
    for (let y = 0; y < height ; y += 1) {
        let xx = startx;
        for (let x = 0; x < width; x += 1) {
            const o = x + y * width;
            const oo = diagonal? (xx * dstWidth + yy):
                  (xx + yy * width);
            dstData[oo] = srcData[o];
            xx += dx;
        }
        yy += dy
    }
    const guideColor = function(arr, offset) {
        const data = new Uint8Array(arr.buffer, offset * 4);
        data[0] = (data[0] < 128)? 255: 0;
        data[1] = (data[1] < 128)? 255: 0;
        data[2] = (data[2] < 128)? 255: 0;
        // alpha, no modify
    }
    if (guide) {
        for (let y = 0; y < dstHeight; y += 1) {
            const o = Math.round(dstWidth /2) + y * dstWidth;
            if ((y % 8) < 4) {
                guideColor(dstData, o);
            }
        }
        for (let x = 0; x < dstWidth; x += 1) {
            const o = x + Math.round(dstHeight / 2) * dstWidth;
            if ((x % 8) < 4) {
                guideColor(dstData, o);
            }
        }
        for (let x = 0; x < Math.min(dstWidth, dstHeight); x += 1) {
            const o = x + x * dstWidth;
            if ((x % 8) < 4) {
                guideColor(dstData, o);
            }
        }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

