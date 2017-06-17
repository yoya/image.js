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
    var overlapImage = null;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, overlapImage);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "guideCheckbox":null,
		  "guideColorText":null,
		  "outfillSelect":null,
		  "projSelect":null,
		  "srcProjXRange":"srcProjXText",
		  "srcProjYRange":"srcProjYText",
		  "srcProjRRange":"srcProjRText"},
		 function(e) {
		     console.debug(e);
		     drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas,
					overlapImage);
		 } );
    var loadOverlapImage = function(file) {
	var image = new Image();
	image.onload = function() {
	    overlapImage = image;
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, overlapImage);
	}
	image.src = file;
    }
    var selectOverlapImage = function(overlap) {
	console.log(overlap);
	if (overlap === "none") {
	    overlapImage = null;
	    drawSrcImageAndCopy(srcImage, srcCanvas, dstCanvas, overlapImage);
	} else {
	    var file = null;
	    switch (overlap) {
	    case "badge":
		file = "img/badge.png";
		break;
	    case "scope":
		file = "img/scope.png";
		break;
	    default:
		console.error("Unknown overlap:"+overlap);
		return ;
	    }
	    loadOverlapImage(file);
	}
    }
    bindFunction({"overlapSelect":null},
		 function(e) {
		     // console.debug(e);
		     var overlap= document.getElementById("overlapSelect").value;
		     selectOverlapImage(overlap);
		 } );
}
function drawSrcImageAndCopy(srcImage, srcCanvas, dstCancas, overlapImage) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var guide = document.getElementById("guideCheckbox").checked;
    var guideColor = document.getElementById("guideColorText").value;
    var outfill = document.getElementById("outfillSelect").value;
    var proj = document.getElementById("projSelect").value;
    var srcProjX = parseFloat(document.getElementById("srcProjXRange").value);
    var srcProjY = parseFloat(document.getElementById("srcProjYRange").value);
    var srcProjR = parseFloat(document.getElementById("srcProjRRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawCopy(srcCanvas, dstCanvas, outfill, guide, guideColor,
	     proj, srcProjX, srcProjY, srcProjR,
	     overlapImage);
}

function getRGBA_NN(imageData, x, y, outfill) {
    return getRGBA(imageData, Math.round(x), Math.round(y), outfill);
}

function getRGBAfromHexColor(hexCode) {
    switch (hexCode.length) {
    case 3: // RGB
	var rgba = [
	    0x11 * parseInt(hexCode.slice(0, 1), 16),
	    0x11 * parseInt(hexCode.slice(1, 2), 16),
	    0x11 * parseInt(hexCode.slice(2, 3), 16),
	    255
	];
	break;
    case 4: // RGBA
	var rgba = [
	    0x11 * parseInt(hexCode.slice(0, 1), 16),
	    0x11 * parseInt(hexCode.slice(1, 2), 16),
	    0x11 * parseInt(hexCode.slice(2, 3), 16),
	    0x11 * parseInt(hexCode.slice(3, 4), 16)
	];
	break;
    case 6: // RRGGBB
	var rgba = [
	    parseInt(hexCode.slice(0, 2), 16),
	    parseInt(hexCode.slice(2, 4), 16),
	    parseInt(hexCode.slice(4, 6), 16),
	    255
	];
	break;
    case 8: // RRGGBBAA
	var rgba = [
	    parseInt(hexCode.slice(0, 2), 16),
	    parseInt(hexCode.slice(2, 4), 16),
	    parseInt(hexCode.slice(4, 6), 16),
	    parseInt(hexCode.slice(6, 8), 16)
	];
	break;
    default:
	var rgba = [255,255,255,0];
    }
    return rgba;
}

function drawCopy(srcCanvas, dstCanvas, outfill, guide, guideColor,
		  proj, srcProjX, srcProjY, srcProjR,
		  overlapImage) {
    // console.debug("drawCopy");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var guideRGBA = getRGBAfromHexColor(guideColor);
    dstCanvas.style.backgroundColor = "#" + guideColor;
    if (proj === "normal") {
	var radius = Math.sqrt(srcWidth*srcWidth + srcHeight*srcHeight) / 2;
	var dstWidth  = Math.ceil(radius*2);
	var dstHeight = dstWidth;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
	//
	var scale = dstWidth/2 / radius / srcProjR;
	// console.log( Math.round(x1), Math.round(y1) );
	for (var dstY = 0 ; dstY < dstHeight; dstY++) {
            for (var dstX = 0 ; dstX < dstWidth; dstX++) {
		var dx = dstX - dstWidth/2;
		var dy = dstY - dstHeight/2;
		if (guide && (dstWidth*dstHeight < 4 * (dx*dx + dy*dy))) {
		    var rgba = guideRGBA;
		} else {
		    var srcX = dx  / scale + srcWidth*srcProjX;
		    var srcY = dy / scale + srcHeight*(1-srcProjY);
		    var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		}
		setRGBA(dstImageData, dstX, dstY, rgba);
	    }
	}
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
		    var srcX = px + srcWidth*srcProjX;
		    var srcY = py + srcHeight*(1-srcProjY);
		    var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		} else if (guide) {
		    var rgba = guideRGBA;
		} else {
		    if (outfill === "white") {
		    var rgba = [255,255,255,255];
		    } else if (outfill === "black") {
			var rgba = [0, 0, 0, 255];
		    } else {
			if (proj === "fisheye") {
			    var pr = 1 - 2*Math.acos(1)/Math.PI;
			} else { // doom
			    var pr = 2 - 4*(0.5-Math.atan2(1, 1)/Math.PI);
			}
			pr *= srcProjR;
			var px = (rr==0.0) ? 0.0 : (pr*dx*sr/rr);
			var py = (rr==0.0) ? 0.0 : (pr*dy*sr/rr);
			var srcX = px + srcWidth*srcProjX;
			var srcY = py + srcHeight*(1-srcProjY);
			var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		    }
		}
		setRGBA(dstImageData, dstX, dstY, rgba);
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    if (overlapImage) {
	dstCtx.drawImage(overlapImage, 0, 0,
			 overlapImage.width, overlapImage.height,
		     0, 0, dstWidth, dstHeight);
    }
}
