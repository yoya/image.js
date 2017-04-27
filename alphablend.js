"use strict";
/*
 * 2017/04/27- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas1 = document.getElementById("srcCanvas1");
    var srcCanvas2 = document.getElementById("srcCanvas2");
    var srcCanvas1Container = document.getElementById("srcCanvas1Container");
    var srcCanvas2Container = document.getElementById("srcCanvas2Container");
    var dstCanvas = document.getElementById("dstCanvas");
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value)
    var linearGamma = document.getElementById("linearGammaCheckbox").checked;
    var ratioRange  = document.getElementById("ratioRange");
    var ratio1Range = document.getElementById("ratio1Range");
    var ratio2Range = document.getElementById("ratio2Range");
    var ratioText  = document.getElementById("ratioText");
    var ratio1Text = document.getElementById("ratio1Text");
    var ratio2Text = document.getElementById("ratio2Text");
    //
    var srcImage1 = new Image(srcCanvas1.width, srcCanvas1.height);
    var srcImage2 = new Image(srcCanvas2.width, srcCanvas2.height);
    
    dropFunction(srcCanvas1Container, function(dataURL) {
	srcImage1 = new Image();
	srcImage1.onload = function() {
	    drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
	    drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas);
	}
	srcImage1.src = dataURL;
    }, "DataURL");
    dropFunction(srcCanvas2Container, function(dataURL) {
	srcImage2 = new Image();
	srcImage2.onload = function() {
	    drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
	    drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, linearGamma);
	}
	srcImage2.src = dataURL;
    }, "DataURL");
    
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText",
		  "linearGammaCheckbox":null,
		  "ratioRange":"ratioText",
		  "ratio1Range":"ratio1Text",
		  "ratio2Range":"ratio2Text"},
		 function(target) {
		     maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
		     linearGamma = document.getElementById("linearGammaCheckbox").checked;
		     if ((target.id === "ratioRange") || (target.id === "ratioText")) {
			 var ratio = parseFloat(ratioRange.value);
			 ratio1Range.value = ratio1Text.value = 1 - ratio;
			 ratio2Range.value = ratio2Text.value = ratio;
		     }
		     drawSrcImage(srcImage1, srcCanvas1, maxWidthHeight);
		     drawSrcImage(srcImage2, srcCanvas2, maxWidthHeight);
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, linearGamma);
		 } );
    bindFunction({"methodSelect":null},
		 function() {
		     drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas);
		 } );
    
}

function drawAlphaBrend(srcCanvas1, srcCanvas2, dstCanvas, linearGamma) {
    // console.debug("drawAlphaBrend")
    var method = document.getElementById("methodSelect").value;
    var ratio1 = parseFloat(document.getElementById("ratio1Range").value);
    var ratio2 = parseFloat(document.getElementById("ratio2Range").value);
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

    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX1 = dstX, srcY1 = dstY;
	    var srcX2 = dstX, srcY2 = dstY;
	    var rgba1 = getRGBA(srcImageData1, srcX1, srcY1);
	    var rgba2 = getRGBA(srcImageData2, srcX2, srcY2);
	    if (linearGamma) {
		rgba1 = sRGB2linearRGB(rgba1);
		rgba2 = sRGB2linearRGB(rgba2);
		var [r1,g1,b1,a1] = rgba1;
		var [r2,g2,b2,a2] = rgba2;
	    } else {
		var [r1,g1,b1,a1] = rgba1; // uint to double
		var [r2,g2,b2,a2] = rgba2; // uint to double
		[r1, g1, b1, a1] = [r1, g1, b1, a1].map(function(v) { return v/255; });
		[r2, g2, b2, a2] = [r2, g2, b2, a2].map(function(v) { return v/255; });
	    }
	    var rgba;
	    switch (method) {
	    case "plus":
		rgba = [r1*ratio1 + r2*ratio2,
			g1*ratio1 + g2*ratio2,
			b1*ratio1 + b2*ratio2,
			(a1+a2)/2];
		break;
	    case "minus":
		rgba = [r1*ratio1 - r2*ratio2,
			g1*ratio1 - g2*ratio2,
			b1*ratio1 - b2*ratio2,
			(a1+a2)/2];
		break;
	    case "multi":
		rgba = [r1*ratio1 * r2*ratio2,
			g1*ratio1 * g2*ratio2,
			b1*ratio1 * b2*ratio2,
			(a1 + a2)/2];
		break;
	    case "div":
		rgba = [r1*ratio1 / r2*ratio2,
			g1*ratio1 / g2*ratio2,
			b1*ratio1 / b2*ratio2,
			(a1 + a2)/2];
		break;
	    default:
		console.error("unknown method:"+method);
		break;
	    }
	    if (linearGamma) {
		rgba = linearRGB2sRGB(rgba);
	    } else {
		rgba = rgba.map(function(v) { return v*255; });
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
