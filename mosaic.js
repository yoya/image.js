"use strict";
/*
 * 2017/06/22- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var blockSize = parseFloat(document.getElementById("blockSizeRange").value);
    var blockType = document.getElementById("blockTypeSelect").value;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
		 } );
    bindFunction({"blockSizeRange":"blockSizeText",
		  "blockTypeSelect":null},
		 function() {
		     blockSize = parseFloat(document.getElementById("blockSizeRange").value);
		     blockType = document.getElementById("blockTypeSelect").value;
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawMosaic(srcCanvas, dstCanvas, blockSize, blockType);
		 } );
}

function drawMosaic(srcCanvas, dstCanvas, blockSize, blockType) {
    // console.debug("drawMosaic");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    console.log("blockType:"+blockType);
    if (blockType === "square") {
	console.debug("square");
	for (var dstY = 0 ; dstY < dstHeight; dstY+=blockSize) {
            for (var dstX = 0 ; dstX < dstWidth; dstX+=blockSize) {
		var [r2, g2, b2, a2] = [0, 0, 0, 0];
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			var srcX = dstX + x
			var srcY = dstY + y;
			var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
			r2 += r;  g2 += g;  b2 += b; a2 += a;
		    }
		}
		var bs2 = blockSize*blockSize;
		r2 /= bs2; g2 /= bs2; b2 /= bs2; a2 /= bs2;
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
	    }
	}
    } else { // hexagon
	console.debug("hexagon");
	var blockSizeH = Math.round(blockSize * Math.sqrt(1 - 0.25));
	var blockSize_2 = Math.round(blockSize / 2);
	var odd = true;
	for (var dstY = -blockSizeH ; dstY < dstHeight + blockSizeH; dstY+=blockSizeH) {
            for (var dstX = (odd)?0:blockSize_2 ; dstX < dstWidth + blockSize; dstX+=blockSize) {
		var w = (dstX+blockSize<dstWidth)?blockSize:(dstWidth-dstX);
		var h = (dstY+blockSizeH<dstHeight)?blockSizeH:(dstHeight-dstY);
		// console.log("dstX, dstY, w, h:", dstX, dstY, w, h);
		var [r2, g2, b2, a2] = [0, 0, 0, 0];
		for (var y = 0 ; y < blockSize ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			var srcX = dstX + x
			var srcY = dstY + y;
			var [r, g, b, a] = getRGBA(srcImageData, srcX, srcY);
			r2 += r;  g2 += g;  b2 += b; a2 += a;
		    }
		}
		var bs2 = blockSize*blockSize;
		r2 /= bs2; g2 /= bs2; b2 /= bs2; a2 /= bs2;
		for (var y = Math.floor(-blockSize/3) ; y < 0 ; y++) {
		    for (var x = -2*y  ; x < blockSize + 2*y ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
		for (var y = 0 ; y < Math.ceil(blockSize*2/3) ; y++) {
		    for (var x = 0 ; x < blockSize ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
		for (var y = Math.floor(blockSize*2/3); y < blockSize ; y++) {
		    for (var x = Math.floor((y-blockSize*2/3)*2) -1 ; x < 1 + blockSize - Math.floor((y-blockSize*2/3)*2) ; x++) {
			setRGBA(dstImageData, dstX + x, dstY + y, [r2,g2,b2,a2]);
		    }
		}
	    }
	    odd = !odd;
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
