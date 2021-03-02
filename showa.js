"use strict";
/*
 * 2021/03/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
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
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawShowa(srcCanvas, dstCanvas);
}
function colortrans_showa(r, g, b) {
    return [
        0.7 * r + 0.1 * g + 0.2 * b,
        0.0 * r + 0.8 * g + 0.2 * b,
        0.1 * r + 0.2 * g + 0.6 * b
    ];
}
    
function contrast_showa(x) {
    if (Array.isArray(x)) {
        let arr = []
        for (let i = 0, n = x.length ; i < n; i++) {
            arr.push(contrast_showa(x[i]))
        }
        return arr;
    }
    return (2*x +1)/4 - Math.tan(1.1 - 2*x)/8;
}

function smoothing(srcImageData, srcX, srcY, filterMatrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
        for (var x = startX ; x < endX ; x++) {
            var [r, g, b, a] = getRGBA(srcImageData, x, y, OUTFILL_EDGE);
            r2 += r * filterMatrix[i];
            g2 += g * filterMatrix[i];
            b2 += b * filterMatrix[i];
            i++;
        }
    }
    var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
    return [r2, g2, b2, a];
}

function noize_showa(r, g, b) {
    var r0 = Math.random()
    var r1 = 0.2 * Math.random()
    var rr = 0, rg = 0, rb = 0;
    if (r0 < 0.25) {
        rr = r1 * Math.random();
    } else if (r0 < 0.75) {
        rg = r1 * Math.random();
    } else {
        rb = r1 * Math.random();
    }
    return [ r - rr, g - rg, b - rb ];
}

function drawShowa(srcCanvas, dstCanvas) {
    console.debug("drawShowa");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var tmpImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);

    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
	    var [r,g,b,a] = getRGBA(srcImageData, srcX, srcY);
            r /= 255 ;  g /= 255 ; b /= 255;
            [r, g, b] = contrast_showa([r, g, b])
            [r, g, b] = colortrans_showa(r, g, b)
            [r, g, b] = noize_showa(r, g, b)
            r *= 255 ; g *= 255 ; b *= 255;
	    setRGBA(tmpImageData, dstX, dstY, [r,g,b,a]);
	}
    }
    var filterWindow = 3;
    var filterMatrix = new Float32Array(filterWindow * filterWindow);
    var triangle = pascalTriangle(filterWindow);
    var i = 0;
    for (var y = 0; y < filterWindow; y++) {
        for (var x = 0 ; x < filterWindow; x++) {
            filterMatrix[i++] = triangle[x] * triangle[y];
        }
    }
    var total = filterMatrix.reduce(function(p, v) {return p+v; });;
    filterMatrix = filterMatrix.map(function(v) { return v / total; })
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX;
	    var srcY = dstY;
            // var rgba = getRGBA(tmpImageData, srcX, srcY);
            var rgba = smoothing(tmpImageData, srcX, srcY, filterMatrix, filterWindow);
            setRGBA(dstImageData, dstX, dstY, rgba);
        }
    }    
    
    dstCtx.putImageData(dstImageData, 0, 0);
}
