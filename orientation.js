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
    const reverse = horizontal !== vertical;  // xor
    const o = (reverse? 1: 0) + (vertical? 2: 0) + (diagonal? 4: 0);
    return o + 1;  // orientation;
}

function fromOrientation(orientation) {
    const o = orientation - 1;
    const reverse = (o & 1)? true: false;
    const vertical = (o & 2)? true: false;
    const horizontal = reverse !== vertical;  // xor
    const diagonal = (o & 4)? true: false;
    return [horizontal, vertical, diagonal];
}

function rotateOrientation(orientation, degree) {
    let [horizontal, vertical, diagonal] = fromOrientation(orientation);
    const mirror = horizontal ^ vertical ^ diagonal;
    const rotate90 = (degree === 90);
    /*
      * rotate 90
      * {diag,vert,hori}: 1:{000} => 6:{101} => 4:{011} => 7:{110}
      * {diag,vert,hori}: 5:{100} => 3:{010} => 8:{111} => 2:{001}
      */
    if (mirror ^ rotate90) {
        [horizontal, vertical] = [vertical, !horizontal];
    } else {
        [horizontal, vertical] = [!vertical, horizontal];
    }
    diagonal = ! diagonal;
    return toOrientation(horizontal, vertical, diagonal);
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
                  "horizontalCheckbox":null,
                  "verticalCheckbox":null,
                  "diagonalCheckbox":null,
                  "rotate90Button":null, "rotate270Button":null
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
                         const [horizontal, vertical, diagonal] = fromOrientation(orientation);
                         params.horizontalCheckbox = horizontal;
                         params.verticalCheckbox = vertical;
                         params.diagonalCheckbox = diagonal;
                     } else {
                         const horizontal = params.horizontalCheckbox;
                         const vertical = params.verticalCheckbox;
                         const diagonal = params.diagonalCheckbox;
                         const orientation = toOrientation(horizontal, vertical, diagonal);
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
    const [horizontal, vertical, diagonal] = fromOrientation(orientation);
    const guide = params.guideCheckbox;
    //
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    const dstWidth = Math.max(width, height)
    const dstHeight = dstWidth;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.getImageData(0, 0, dstWidth, dstHeight);
    const srcData = new Uint32Array(srcImageData.data.buffer);
    const dstData = new Uint32Array(dstImageData.data.buffer);
    const n = srcData.length;

    // draw image with orientation
    let startx = horizontal? (width - 1): 0;
    let dx = horizontal? -1: 1;
    let starty = vertical? (height - 1): 0;
    let dy = vertical? -1: 1;
    let yy = starty;
    for (let y = 0; y < height ; y += 1) {
        let xx = startx;
        for (let x = 0; x < width; x += 1) {
            const o = x + y * width;
            const oo = diagonal? (xx * dstWidth + yy): (xx + yy * width);
            dstData[oo] = srcData[o];
            xx += dx;
        }
        yy += dy
    }
    // draw guide lines
    const width_2 = Math.round((diagonal? height: width) / 2);
    const height_2 = Math.round((diagonal? width: height) / 2);
    const guideColor = function(arr, offset) {
        const data = new Uint8Array(arr.buffer, offset * 4);
        const [r, g, b, a] = data.subarray(0, 4);
        if (a) {
            data[0] = (data[0] < 128)? 255: 0;  // red
            data[1] = (data[1] < 128)? 255: 0;  // green
            data[2] = (data[2] < 128)? 255: 0;  // blue
        }
        data[3] = 255;  // alpha
    }
    if (guide) {
        for (let y = 0; y < dstHeight; y += 1) {
            const o = width_2 + y * dstWidth;
            if ((y % 8) < 4) {  // dashed line
                guideColor(dstData, o);
            }
        }
        for (let x = 0; x < dstWidth; x += 1) {
            const o = x + height_2 * dstWidth;
            if ((x % 8) < 4) {  // dashed line
                guideColor(dstData, o);
            }
        }
        for (let x = 0; x < dstWidth; x += 1) {
            const o = x + x * dstWidth;
            if ((x % 8) < 4) {  // dashed line
                guideColor(dstData, o);
            }
        }
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

