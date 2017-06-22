"use strict";
/*
 * 2017/06/23- (c) yoya@awm.jp
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
	    drawSrcImageAndTrim(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndTrim(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndTrim(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawTrim(srcCanvas, dstCanvas);
}

function matchColorLineNum(imageData, rgba, isVert, start, d) {
    var [r, g, b, a] = rgba;
    var width = imageData.width, height = imageData.height;
    var num = 0;
    if (isVert) {
	if (d > 0) {
	    for (var y = start ; y < height ; y+= d) {
		for (var x = 0 ; x < width ; x++) {
		    var [r2,g2,b2,a2] = getRGBA(imageData, x, y);
		    if ((r !== r2) || (g !== g2) || (b !== b2) || (a !== a2)) {
			return num;
		    }
		}
		num ++;
	    }
	} else if (d === 0) {
	    console.error("ERROR: dy === 0");
	} else { // d < 0
	    for (var y = start ; y >= 0 ; y+= d) {
		for (var x = 0 ; x < width ; x++) {
		    var [r2,g2,b2,a2] = getRGBA(imageData, x, y);
		    if ((r !== r2) || (g !== g2) || (b !== b2) || (a !== a2)) {
			return num;
		    }
		}
		num ++;
	    }
	}
    } else { // ! isVert
	if (d > 0) {
	    for (var x = start ; x < width ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var [r2,g2,b2,a2] = getRGBA(imageData, x, y);
		    if ((r !== r2) || (g !== g2) || (b !== b2) || (a !== a2)) {
			return num;
		    }
		}
		num ++;
	    }
	} else if (d === 0) {
	    console.error("ERROR: dx === 0");
	} else { // d < 0
	    for (var x = start ; x >= 0 ; x+= d) {
		for (var y = 0 ; y < height ; y++) {
		    var [r2,g2,b2,a2] = getRGBA(imageData, x, y);
		    if ((r !== r2) || (g !== g2) || (b !== b2) || (a !== a2)) {
			return num;
		    }
		}
		num ++;
	    }
	}
    }
    console.debug("perfect color match", isVert, start, d, num);
    return num;
}

function drawTrim(srcCanvas, dstCanvas) {
    // console.debug("drawTrim");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;

    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);

    var baseRGBA = getRGBA(srcImageData, 0, 0);
    var minX = matchColorLineNum(srcImageData, baseRGBA,
				 false, 0, 1);
    var maxX = srcWidth - matchColorLineNum(srcImageData, baseRGBA,
					     false, srcWidth - 1, -1);
    var minY = matchColorLineNum(srcImageData, baseRGBA,
				 true, 0, 1);
    var maxY = srcHeight - matchColorLineNum(srcImageData, baseRGBA,
					    true, srcHeight - 1, -1);
    console.debug("minX, minY, maxX, maxY:", minX, minY, maxX, maxY);
    var dstWidth  = maxX - minX;
    var dstHeight = maxY - minY;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX + minX;
	    var srcY = dstY + minY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
