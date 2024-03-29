"use strict";
/*
 * 2021/11/13 (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

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

// direction: 0:horizontal, 1:vertical
function mirrorOrientation(orientation, direction) {
    let [horizontal, vertical, diagonal] = fromOrientation(orientation);
    if (diagonal ^ direction) {
        vertical = ! vertical;
    } else {
        horizontal = ! horizontal;
    }
    return toOrientation(horizontal, vertical, diagonal);
}

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    const dstCanvas2 = document.getElementById("dstCanvas2");
    const params = {};
    let srcImage = new Image();
    srcImage.src = "./img/RGBY.png";
    srcImage.onload = function() {
	drawSrcImageAndOrientation(srcImage, srcCanvas,
                                   dstCanvas, dstCanvas2, params);
    }
    dropFunction(document, function(dataURL) {
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
                  "guideCheckbox":null
                 }, function(target) {
		     drawSrcImageAndOrientation(srcImage, srcCanvas,
                                                dstCanvas, dstCanvas2, params);
		 }, params);
    bindFunction({"orientationSelect":null,
                  "horizontalCheckbox":null,
                  "verticalCheckbox":null,
                  "diagonalCheckbox":null,
                  "rotate90Button":null, "rotate270Button":null,
                  "horizontalButton":null, "verticalButton":null,
                 }, function(target) {
                     if ((target.id === "orientationSelect") ||
                         (target.id === "rotate90Button") ||
                         (target.id === "rotate270Button") ||
                         (target.id === "horizontalButton") ||
                         (target.id === "verticalButton")) {
                         let orientation = params.orientationSelect;
                         switch (target.id) {
                         case "rotate90Button":
                             orientation = rotateOrientation(orientation, 90);
                             params.orientationSelect = orientation;
                             break;
                         case "rotate270Button":
                             orientation = rotateOrientation(orientation, 270);
                             params.orientationSelect = orientation;
                             break;
                         case "horizontalButton":
                             orientation = mirrorOrientation(orientation, 0);
                             params.orientationSelect = orientation;
                             break;
                         case "verticalButton":
                             orientation = mirrorOrientation(orientation, 1);
                             params.orientationSelect = orientation;
                             break;
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
                     bind2elements(params);
		     drawSrcImageAndOrientation(srcImage, srcCanvas,
                                                dstCanvas, dstCanvas2, params);
		 }, params);
}

function drawSrcImageAndOrientation(srcImage, srcCanvas,
                                    dstCancas, dstCancas2, params) {
    const maxWidthHeight = params.maxWidthHeightRange;
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawOrientation(srcCanvas, dstCanvas, params);
    const params2 = Object.assign({}, params);
    const orientation = params2.orientationSelect;
    params2.orientationSelect = [0, 1, 2, 3, 4, 5, 8, 7, 6][orientation];
    drawOrientation(srcCanvas, dstCanvas2, params2);
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
            const oo = diagonal? (xx * dstHeight + yy): (xx + yy * width);
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

