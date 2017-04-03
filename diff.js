"use strict";
/*
 * 2017/04/02- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas1 = document.getElementById("srcCanvas1");
    var srcCanvas2 = document.getElementById("srcCanvas2");
    var dstCanvas = document.getElementById("dstCanvas");
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var srcImage1 = new Image(srcCanvas1.width, srcCanvas1.height);
    var srcImage2 = new Image(srcCanvas2.width, srcCanvas2.height);
    srcCanvas1.style.border = "thick solid red";
    srcCanvas2.style.border = "thick solid green";
    dstCanvas.style.border = "thick solid blue";
    
    dropFunction(srcCanvas1, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	    drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
	}
	srcImage1.src = dataURL;
    }, "DataURL");
    dropFunction(srcCanvas2, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	    drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
	}
	srcImage2.src = dataURL;
    }, "DataURL");
    
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		 "normalizeCheckbox":null},
		 function() {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
		 } );
    bindFunction({"methodSelect":null},
		 function() {
		     drawDiff(srcCanvas1, srcCanvas2, dstCanvas);
		 } );
    
}

function drawDiff(srcCanvas1, srcCanvas2, dstCanvas) {
    // console.debug("drawCopy")
    var normalize = document.getElementById("normalizeCheckbox").checked;
    var method = document.getElementById("methodSelect").value;
    var srcCtx1 = srcCanvas1.getContext("2d");
    var srcCtx2 = srcCanvas2.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth1 = srcCanvas1.width, srcHeight1 = srcCanvas1.height;
    var srcWidth2 = srcCanvas2.width, srcHeight2 = srcCanvas2.height;
    var dstWidth  = (srcWidth1  < srcWidth2) ? srcWidth1  : srcWidth2;
    var dstHeight = (srcHeight1 < srcHeight2)? srcHeight1 : srcHeight2;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var srcImageData1 = srcCtx1.getImageData(0, 0, srcWidth1, srcHeight1);
    var srcImageData2 = srcCtx2.getImageData(0, 0, srcWidth2, srcHeight2);
    
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);

    var nSample4 = dstWidth * dstHeight * 4;
    var tmpImageData = {width:dstWidth, data:new Float32Array(nSample4)};
    
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX1 = dstX, srcY1 = dstY;
	    var srcX2 = dstX, srcY2 = dstY;
	    var [r1,g1,b1,a1] = getRGBA(srcImageData1, srcX1, srcY1);
	    var [r2,g2,b2,a2] = getRGBA(srcImageData2, srcX2, srcY2);
	    var [rdiff, gdiff, bdiff] = [Math.abs(r2 - r1), Math.abs(g2 - g1), Math.abs(b2 - b1)];
	    var [rmse, gmse, bmse] = [rdiff*rdiff, gdiff*gdiff, bdiff*bdiff];
	    var rgba;
	    switch (method) {
	    case "ae":
		rgba = [rdiff, gdiff, bdiff, 255];
		break;
	    case "mse":
		rgba = [rmse/255, gmse/255, bmse/255, 255];
		break;
	    case "psnr":
		rgba = [20 * Math.log10(255) - 10 * Math.log10(rmse),
			20 * Math.log10(255) - 10 * Math.log10(gmse),
			20 * Math.log10(255) - 10 * Math.log10(bmse),
			255];
		break;
	    default:
		console.error("unknown method:"+method);
		break;
	    }
	    setRGBA(tmpImageData, dstX, dstY, rgba);
	}
    }
    if (normalize) {
	var maxLuminance = 0;
	for (var i = 0 ; i < nSample4 ; i+=4) {
	    var luminance = (3 * tmpImageData.data[i] + 6 * tmpImageData.data[i+1] + tmpImageData.data[i+2]) / 10;
	    if ((luminance  > maxLuminance) && (luminance !== Infinity)) {
		maxLuminance = luminance;
	    }
	}
	console.debug("maxLuminance:" + maxLuminance);
	for (var i = 0 ; i < nSample4 ; i+=4) {
	    for (var j = 0 ; j < 3 ; j++) {
		if ((maxLuminance !== 0) ||
		    (maxLuminance !== Infinity)) {
		    tmpImageData.data[i+j]   *= 255 / maxLuminance;
		}
		if ((255 < tmpImageData.data[i+j]) ||
		    (tmpImageData.data[i+j] === Infinity)) {
		    tmpImageData.data[i+j] = 255;
		}
	    }
	}
    }
    for (var i = 0 ; i < nSample4 ; i++) {
	dstImageData.data[i] = tmpImageData.data[i] >>> 0;
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
