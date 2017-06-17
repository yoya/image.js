"use strict";
/*
 * 2017/06/16- (c) yoya@awm.jp
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
		  "outfillSelect":null,
		  "projSelect":null,
		  "srcProjXRange":"srcProjXText",
		  "srcProjYRange":"srcProjYText",
		  "srcProjRRange":"srcProjRText"},
		 function(e) {
		     console.debug(e);
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var outfill = document.getElementById("outfillSelect").value;
    var proj = document.getElementById("projSelect").value;
    var srcProjX = parseFloat(document.getElementById("srcProjXRange").value);
    var srcProjY = parseFloat(document.getElementById("srcProjYRange").value);
    var srcProjR = parseFloat(document.getElementById("srcProjRRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas, outfill,
	     proj, srcProjX, srcProjY, srcProjR);
}

function drawCopy(srcCanvas, dstCanvas, outfill,
		  proj, srcProjX, srcProjY, srcProjR) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    dstCanvas.style.backgroundColor = "white";
    if (proj === "normal") {
	var radius = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight) / 2;
	var dstWidth  = Math.ceil(radius*2);
	var dstHeight = dstWidth;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
	//
	var x1 = Math.round(radius - srcWidth/2);
	var y1 = Math.round(radius - srcHeight/2);
	// console.log( Math.round(x1), Math.round(y1) );
	for (var dstY = 0 ; dstY < dstHeight; dstY++) {
            for (var dstX = 0 ; dstX < dstWidth; dstX++) {
		var srcX = dstX - x1;
		var srcY = dstY - y1;
		var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
		setRGBA(dstImageData, dstX, dstY, rgba);
	    }
	}
	dstCtx.putImageData(dstImageData, 0, 0);
    } else {
	var dstWidth  = Math.min(srcWidth, srcHeight);
	var dstHeight = dstWidth;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
	// http://q.hatena.ne.jp/1347662738
	for (var dstY = 0 ; dstY < dstHeight; dstY++) {
            for (var dstX = 0 ; dstX < dstWidth; dstX++) {
		var kk= dstWidth * 0.5;
		var ll= dstHeight * 0.5;
		var sr = Math.min(kk, ll);
		var dx = dstX - kk;
		var dy = dstY - ll;
		var rr = Math.hypot(dx, dy);
		if (rr < sr) {
		    if (proj === "fisheye") {
			var pr = 1 - 2*Math.acos(rr/sr)/Math.PI;
		    } else { // doom
			var pr = 2 - 4*(0.5-Math.atan2(rr,sr)/Math.PI);
		    }
		    pr *= srcProjR;
		    var px = (rr==0.0) ? 0.0 : (pr*dx*sr/rr);
		    var py = (rr==0.0) ? 0.0 : (pr*dy*sr/rr);
		    var srcX = Math.round(px + srcWidth*srcProjX);
		    var srcY = Math.round(py + srcHeight*srcProjY);
		    var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
		    setRGBA(dstImageData, dstX, dstY, rgba);
		} else {
		    if (outfill === "white") {
			var rgba = [255,255,255,255];
		    } else if (outfill === "black") {
			var rgba = [0, 0, 0, 255];
		    } else {
			if (proj === "fisheye") {
			    var pr = 1 - 2*Math.acos(1)/Math.PI;
			} else { // doom
			    var pr = 2 - 4*(0.5-Math.atan2(1, 0)/Math.PI);
			}
			pr *= srcProjR;
			var px = (rr==0.0) ? 0.0 : (pr*dx*sr/rr);
			var py = (rr==0.0) ? 0.0 : (pr*dy*sr/rr);
			var srcX = Math.round(px + srcWidth*srcProjX);
			var srcY = Math.round(py + srcHeight*srcProjY);
			var rgba = getRGBA(srcImageData, srcX, srcY, outfill);
		    }
		    setRGBA(dstImageData, dstX, dstY, rgba);
		}
	    }
	}
	dstCtx.putImageData(dstImageData, 0, 0);
    }
}
