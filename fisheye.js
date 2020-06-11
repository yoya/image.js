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
    var params = {};
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndFisheye(srcImage, srcCanvas, dstCanvas, params);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "guideCheckbox":null,
		  "srcProjSelect":null,
		  "srcProjXRange":"srcProjXText",
		  "srcProjYRange":"srcProjYText",
		  "srcProjRRange":"srcProjRText",
		  "dstProjSelect":null,
		  "dstProjXRange":"dstProjXText",
		  "dstProjYRange":"dstProjYText",
		  "dstProjRRange":"dstProjRText"
		 },
		 function(target) {
		     console.debug("target id:" + target.id);
		     drawSrcImageAndFisheye(srcImage, srcCanvas, dstCanvas, params);
		 }, params);
}

function drawSrcImageAndFisheye(srcImage, srcCanvas, dstCanvas, params) {
    var maxWidthHeight = params["maxWidthHeightRange"];
    var guide = params["guideCheckbox"];
    var srcProj  = params["srcProjSelect"];
    var srcProjX = params["srcProjXRange"];
    var srcProjY = params["srcProjYRange"];
    var srcProjR = params["srcProjRRange"];
    var dstProj  = params["dstProjSelect"];
    var dstProjX = params["dstProjXRange"];
    var dstProjY = params["dstProjYRange"];
    var dstProjR = params["dstProjRRange"];
    // console.debug("drawSrcImageAndFisheye  guide:" + guide);
    // console.debug("srcProj:" + srcProj+","+srcProjX+","+srcProjY+","+ srcProjR);
    // console.debug("dstProj:" + dstProj+","+dstProjX+","+dstProjY+","+ dstProjR);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawFisheye(srcCanvas, dstCanvas, guide,
		srcProj, srcProjX, srcProjY, srcProjR,
		dstProj, dstProjX, dstProjY, dstProjR);
}

function fisheyeTransform(dstX, dstY, dstImageData, srcImageData,
			  srcProj, srcProjX, srcProjY, srcProjR,
			  dstProj) {
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
	srcXY = xyz2fisheye(xyz, srcWidth, srcHeight, srcProjX, srcProjY, srcProjR);
	break;
    default:
	console.error("dstProj:" + dstProj);
	return null;
    }
    return srcXY; // [x, y]
}

function drawFisheye(srcCanvas, dstCanvas, guide,
		     srcProj, srcProjX, srcProjY, srcProjR,
		     dstProj, dstProjX, dstProjY, dstProjR) {
    // console.debug("drawFisheye");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    //
    if (dstWidth !== dstHeight)  {
	if (dstWidth < dstHeight)  {
	    dstWidth = dstHeight;
	} else {
	    dstHeight = dstWidth;
	}
    }
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
						srcProj, srcProjX, srcProjY, srcProjR,
						dstProj);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    if (guide) {
	var srcProjCenterX = srcProjX * srcWidth;
	var srcProjCenterY = srcProjY * srcHeight;
	var srcProjRadius = srcProjR * (srcWidth + srcHeight) / 4;
	srcCtx.save();
	srcCtx.strokeStyle="yellow";
	srcCtx.lineWidth = 1.5;
	srcCtx.beginPath();
	srcCtx.arc(srcProjCenterX, srcProjCenterY,
		   srcProjRadius, 0, 2 * Math.PI);
	srcCtx.stroke();
	srcCtx.restore();
    }

}
