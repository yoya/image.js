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
	    var bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
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
		     // console.debug(e);
		     var bilinear = false;
		     drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
					    bilinear, overlapImage);
		 } );
    bindFunction({"bilinearButton":null},
		 function(e) {
		     // console.debug(e);
		     var bilinear = true;
		     drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
					    bilinear, overlapImage);
		 } );
    
    var loadOverlapImage = function(file) {
	var image = new Image();
	image.onload = function() {
	    overlapImage = image;
	    var bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
	}
	image.src = file;
    }
    var selectOverlapImage = function(overlap) {
	console.log(overlap);
	if (overlap === "none") {
	    overlapImage = null;
	    var bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
	} else {
	    var file = null;
	    var url = null;
	    switch (overlap) {
	    case "badge":
		file = "img/badge.png";
		url = "https://twitter.com/_hp23/status/875773014750543873";
		break;
	    case "scope":
		file = "img/scope.png";
		url = "https://twitter.com/KulasanM/status/875611714959556609";
		break;
	    case "clockBlue":
		file = "img/clockBlue.png";
		url ="https://twitter.com/device1020/status/875663435253415936";
		break;
	    case "clockYellow":
		file = "img/clockYellow.png";
		url ="https://twitter.com/device1020/status/875663435253415936";
		break;
	    case "clockRed":
		file = "img/clockRed.png";
		url ="https://twitter.com/device1020/status/875663435253415936";
		break;
	    case "bubbleSoap":
		file = "img/bubbleSoap.png";
		url = "https://twitter.com/NnAone2cmg/status/875738100973969408";
		break;
	    case "bubbleCyan":
		file = "img/bubbleCyan.png";
		url = "https://twitter.com/NnAone2cmg/status/875989771562106881";
		break;
	    case "bubbleMagenta":
		file = "img/bubbleMagenta.png";
		url = "https://twitter.com/NnAone2cmg/status/875990875578302464";
		break;
	    case "bubbleGreen":
		file = "img/bubbleGreen.png";
		url = "https://twitter.com/NnAone2cmg/status/875990875578302464";
		break;
	    case "bubbleBlue":
		file = "img/bubbleBlue.png";
		url = "https://twitter.com/NnAone2cmg/status/875989771562106881";
		break;
	    case "bubbleRainbow":
		file = "img/bubbleRainbow.png";
		url = "https://twitter.com/NnAone2cmg/status/876103882752917505";
		break;
	    default:
		console.error("Unknown overlap:"+overlap);
		return ;
	    }
	    loadOverlapImage(file);
	    if (url !== null) {
		var html = "Theme Image (c) <a href=\"" + url + "\" target=\"_blank\"\> " + url + " </a>";
		console.log(html);
		document.getElementById("imageCopyright").innerHTML = html;
	    }
	}
    }
    bindFunction({"overlapSelect":null},
		 function(e) {
		     // console.debug(e);
		     var overlap= document.getElementById("overlapSelect").value;
		     selectOverlapImage(overlap);
		 } );
}
function drawSrcImageAndConvert(srcImage, srcCanvas, dstCancas,
				bilinear, overlapImage) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var guide = document.getElementById("guideCheckbox").checked;
    var guideColor = document.getElementById("guideColorText").value;
    var outfill = document.getElementById("outfillSelect").value;
    outfill = outfillStyleNumber(outfill);
    var proj = document.getElementById("projSelect").value;
    var srcProjX = parseFloat(document.getElementById("srcProjXRange").value);
    var srcProjY = parseFloat(document.getElementById("srcProjYRange").value);
    var srcProjR = parseFloat(document.getElementById("srcProjRRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawConvert(srcCanvas, dstCanvas, bilinear, outfill, guide, guideColor,
		proj, srcProjX, srcProjY, srcProjR,
		overlapImage);
}

function drawConvert(srcCanvas, dstCanvas, bilinear, outfill, guide, guideColor,
		     proj, srcProjX, srcProjY, srcProjR,
		     overlapImage) {
    // console.debug("drawConvert");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var guideRGBA = getRGBAfromHexColor(guideColor);
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
		    if (bilinear) {
			var rgba = getRGBA_BL(srcImageData, srcX, srcY, outfill);
		    } else {
			var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		    }
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
		    if (bilinear) {
			var rgba = getRGBA_BL(srcImageData, srcX, srcY, outfill);
		    } else {
			var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		    }
		} else if (guide) {
		    var rgba = guideRGBA;
		} else {
		    if (outfill === OUTFILL_WHITE) {
		    var rgba = [255,255,255,255];
		    } else if (outfill === OUTFILL_BLACK) {
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
			if (bilinear) {
			    var rgba = getRGBA_BL(srcImageData, srcX, srcY, outfill);
			} else {
			    var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
			}
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
			 -0.5, -0.5, dstWidth+1.5, dstHeight+1.5);
    }
}
