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
		  "fisheyeCheckbox":null,
		  "srcProjXRange":"srcProjXText",
		  "srcProjYRange":"srcProjYText",
		  "srcProjRRange":"srcProjRText"},
		 function() {
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var fisheye = document.getElementById("fisheyeCheckbox").checked;
    var srcProjX = parseFloat(document.getElementById("srcProjXRange").value);
    var srcProjY = parseFloat(document.getElementById("srcProjYRange").value);
    var srcProjR = parseFloat(document.getElementById("srcProjRRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas, fisheye, srcProjX, srcProjY, srcProjR);
}

function drawCopy(srcCanvas, dstCanvas, fisheye, srcProjX, srcProjY, srcProjR) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    dstCanvas.style.backgroundColor = "white";

    
    if (fisheye) {
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
		    var pr = 1 - 2*Math.acos(rr/sr)/Math.PI;
		    pr *= srcProjR;
		    var px = (rr==0.0) ? 0.0 : (pr*dx*sr/rr);
		    var py = (rr==0.0) ? 0.0 : (pr*dy*sr/rr);
		    var srcX = Math.round(px + srcWidth*srcProjX);
		    var srcY = Math.round(py + srcHeight*srcProjY);
		    var rgba = getRGBA(srcImageData, srcX, srcY);
		    setRGBA(dstImageData, dstX, dstY, rgba);
		} else {
		    // nothing to do
		}
	    }
	}
	dstCtx.putImageData(dstImageData, 0, 0);
    } else {
	var radius = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight) / 2;
	var dstWidth  = Math.ceil(radius*2);
	var dstHeight = dstWidth;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	var x1 = radius - srcWidth/2;
	var y1 = radius - srcHeight/2;
	var x2 = dstWidth  - 2 * x1;
	var y2 = dstHeight - 2 * y1;
	console.log(Math.ceil(x1), Math.ceil(y1),Math.floor(x2),Math.floor(y2) );
	dstCtx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height,
			 x1, y1, x2, y2);
    }
}
