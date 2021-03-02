"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById("srcCanvas");
    const dstCanvas = document.getElementById("dstCanvas");
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndShowa(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndShowa(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas);
}

function colortrans_showa(r, g, b) {
    return [
        0.65 * r + 0.25 * g + 0.1 * b,
        0.0 * r + 0.8 * g + 0.2 * b,
        //0.7 * r + 0.1 * g + 0.2 * b,
        //0.0 * r + 0.8 * g + 0.2 * b,
        //0.6 * r + 0.2 * g + 0.2 * b,
        //0.1 * r + 0.8 * g + 0.2 * b,
        0.1 * r + 0.2 * g + 0.7 * b
    ];
}
    
function contrast_showa(x) {  // no use.
    if (Array.isArray(x)) {
        let arr = []
        for (let i = 0, n = x.length ; i < n; i++) {
            arr.push(contrast_showa(x[i]))
        }
        return arr;
    }
    return (2*x +1)/4 - Math.tan(1.1 - 2*x)/8;
}

function noize_showa() {
    const r0 = Math.random(), r1 = 64 * Math.random()
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

function mozaic(imageData) {
    let width = imageData.width, height = imageData.height;
    let count = width * height / 5;
    for (let i = 0; i < count; i++) {
        var x1 = (Math.random() * width) | 0;
        var y1 = (Math.random() * height) | 0;
        var x2 = (Math.random() * width) | 0;
        var y2 = (Math.random() * height) | 0;
        let rgba1 = getRGBA(imageData, x1, y1);
        let rgba2 = getRGBA(imageData, x2, y2);
        let [dr, dg, db] = noize_showa();
        rgba1[0] -= dr;  rgba1[1] -= dg; rgba1[2] -= db;
        rgba2[0] += dr;  rgba2[1] += dg; rgba2[2] += db;
        setRGBA(imageData, x1, y1, rgba1);
        setRGBA(imageData, x2, y2, rgba2);
    }
}

function smoothing(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    const startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    const startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    let i = 0;
    let [r2, g2, b2, a2] = [0,0,0,0];
    for (let y = startY ; y < endY ; y++) {
        for (let x = startX ; x < endX ; x++) {
            const [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
            r2 += r * filterMatrix[i];
            g2 += g * filterMatrix[i];
            b2 += b * filterMatrix[i];
            i++;
        }
    }
    const [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    return [r2, g2, b2, a];
}

function drawShowa(srcCanvas, dstCanvas) {
    console.debug("drawShowa");
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const tmpImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);

    const radius = 1.1;
    const slant = Math.sqrt(width*width + height*height) * radius;

    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
	    let [r,g,b,a] = getRGBA(srcImageData, x, y);
            r /= 255 ;  g /= 255 ; b /= 255;
            // show filter
            // [r, g, b] = contrast_showa([r, g, b])
            [r, g, b] = colortrans_showa(r, g, b)
            // vinette
            const dx = (x - (width  / 2)) / (slant/2);
            const dy = (y - (height / 2)) / (slant/2);
            const rad = Math.sqrt(dx*dx + dy*dy);
            const factor = Math.pow(Math.cos(rad/2), 4);
            r *= factor; g *= factor ; b *= factor;
            //
            r *= 255 ; g *= 255 ; b *= 255;
	    setRGBA(tmpImageData, x, y, [r,g,b,a]);
	}
    }
    mozaic(tmpImageData);
    const filterWindow = 3;
    let filterMatrix = new Float32Array(filterWindow * filterWindow);
    const triangle = pascalTriangle(filterWindow);
    let i = 0;
    for (let y = 0; y < filterWindow; y++) {
        for (let x = 0 ; x < filterWindow; x++) {
            filterMatrix[i++] = triangle[x] * triangle[y];
        }
    }
    const total = filterMatrix.reduce(function(p, v) {return p+v; });;
    filterMatrix = filterMatrix.map(function(v) { return v / total; })
    for (let y = 0 ; y < height; y++) {
        for (let x = 0 ; x < width; x++) {
            // const rgba = getRGBA(tmpImageData, x, y);
            const rgba = smoothing(tmpImageData, x, y, filterMatrix, filterWindow);
            setRGBA(dstImageData, x, y, rgba);
        }
    }    
    
    dstCtx.putImageData(dstImageData, 0, 0);
}
