"use strict";
/*
 * 2017/05/30- (c) yoya@awm.jp
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
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "srcProjSelect":null,
		  "dstProjSelect":null},
		 function(target) {
		     console.debug("target id:" + target.id);
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}

function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcProj = document.getElementById("srcProjSelect").value;
    var dstProj = document.getElementById("dstProjSelect").value;
    console.debug("srcProj,dstProj:" + srcProj +", " + dstProj);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas, srcProj, dstProj);
}

function fisheyeTransform(dstX, dstY, dstImageData, srcImageData,
			  srcProj, dstProj) {
    var [dstWidth, dstHeight] = [dstImageData.width, dstImageData.height];
    var [srcWidth, srcHeight] = [srcImageData.width, srcImageData.height];
    var xyz;
    switch (dstProj) {
    case "equirectangular":
	xyz = equirectangular2xyz(dstX, dstY, dstWidth, dstHeight);
	break;
    case "fisheye":
	xyz = fisheye2xyz(dstX, dstY, dstWidth, dstHeight);
	break;
    default:
	console.error("dstProj:" + dstProj);
	return null;
    }
    if (xyz === null) {
	return [-1, -1]; // out of area.
    }
    var srcXY;
    switch (srcProj) {
    case "equirectangular":
	srcXY = xyz2equirectangular(xyz, srcWidth, srcHeight);
	break;
    case "fisheye":
	srcXY = xyz2fisheye(xyz, srcWidth, srcHeight);
	break;
    default:
	console.error("dstProj:" + dstProj);
	return null;
    }
    return srcXY; // [x, y]
}

function drawCopy(srcCanvas, dstCanvas, srcProj, dstProj) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var outfill = "black";
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var [srcX, srcY] = fisheyeTransform(dstX, dstY, dstImageData,
						srcImageData,
						srcProj, dstProj);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
