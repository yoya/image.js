"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 * 2021/03/06- (c) yoya@awm.jp worker
 */

importScripts("../lib/canvas.js");
importScripts("../lib/math.js");
importScripts("../lib/kernel.js");
importScripts("../lib/vinette.js");
importScripts("../lib/smoothing.js");

onmessage = function(e) {
    const srcImageData = e.data.image;
    const color = e.data.color;
    const vinette = e.data.vinette;
    const mosaic = e.data.mosaic;
    const smoothing = e.data.smoothing;
    //console.debug("color, vinette, mosaic, smoothing:", color, vinette, mosaic, smoothing);
    //
    const width = srcImageData.width, height = srcImageData.height;
    //
    const tmpImageData = new ImageData(width, height);
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    const [r, g, b, a] = getRGBA(srcImageData, x, y);
            const [r2, g2, b2] = colortrans_showa(r, g, b)
	    setRGBA(tmpImageData, x, y, [
                (1-color)*r + color*r2,
                (1-color)*g + color*g2,
                (1-color)*b + color*b2,
                a
            ]);
	}
    }
    const radius = 4.0 - 3*vinette;
    const params_vinette = { radius:radius, linearGamma:false, inverse:false };
    mogrifyVinette(tmpImageData, params_vinette);
    mosaic_showa(tmpImageData, mosaic);
    const filterWindow = smoothing;
    const filterMatrix = makeKernel_PascalTriangle(filterWindow);
    const params_smoothing = {
        filterMatrix: filterMatrix,
        filterWindow: filterWindow,
        sigma: null,
        bilateral: false,
        colorScale: null
    };
    const dstImageData = convertSmoothing(tmpImageData, params_smoothing)
    postMessage({image:dstImageData}, [dstImageData.data.buffer]);
}

function alphaBlending(srcImageData, dstImageData, srcRatio, dstRatio) {
    let width = srcImageData.width, height = srcImageData.height;
    if ((width !== dstImageData.width) || (height !== dstImageData.height)) {
        console.error("src|dst ImageData different width, height");
        return null;
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let rgba1 = getRGBA(srcImageData, x, y);
            let rgba2 = getRGBA(dstImageData, x, y);
            rgba2[0]  = srcRatio * rgba1[0] + dstRatio * rgba2[0];
            rgba2[1]  = srcRatio * rgba1[2] + dstRatio * rgba2[0];
            rgba2[2]  = srcRatio * rgba1[3] + dstRatio * rgba2[0];
            setRGBA(dstImageData, x, y, rgba2);
        }
    }
}

function colortrans_showa(r, g, b) {
    return [
        0.65 * r + 0.25 * g + 0.10 * b,
        0.00 * r + 0.80 * g + 0.20 * b,
        0.10 * r + 0.20 * g + 0.70 * b
    ];
}
    
function noize_showa(amp) {
    const r0 = Math.random(), r1 = Math.random() * amp;
    let rr = 0, rg = 0, rb = 0;
    if (r0 < 0.25) {
        rr = r1 * Math.random();
    } else if (r0 < 0.75) {
        rg = r1 * Math.random();
    } else {
        rb = r1 * Math.random();
    }
    return [rr, rg, rb];
}

function mosaic_showa(imageData, amp) {
    let width = imageData.width, height = imageData.height;
    for (let y1 = 3; y1 < height; y1++) {
        for (let x1 = 3; x1 < width; x1++) {
            var x2 = x1 + (3*(Math.random()-0.5)) | 0;
            var y2 = y1 + (3*(Math.random()-0.5)) | 0;
            let rgba1 = getRGBA(imageData, x1, y1, OUTFILL_EDGE);
            let rgba2 = getRGBA(imageData, x2, y2, OUTFILL_EDGE);
            let [dr, dg, db] = noize_showa(32*amp);
            rgba1[0] -= dr;  rgba1[1] -= dg; rgba1[2] -= db;
            rgba2[0] += dr;  rgba2[1] += dg; rgba2[2] += db;
            setRGBA(imageData, x1, y1, rgba1);
            setRGBA(imageData, x2, y2, rgba2);
        }
    }
}
