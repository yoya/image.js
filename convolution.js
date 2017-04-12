"use strict";
/*
 * 2017/04/07- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvas = document.getElementById("dstCanvas");
    srcCanvas.style.border = "thick solid red";
    dstCanvas.style.border = "thick solid blue";
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var filterMatrix = document.getElementById("filterMatrix");
    var filter = document.getElementById("filterSelect").value;
    var [matrix, filterWindow] = selectFilterMatrix(filter);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, matrix, filterWindow);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, matrix, filterWindow);
		 } );
    bindFunction({"filterSelect":null},
		 function() {
		     filter = document.getElementById("filterSelect").value;    srcCanvas.style.border = "thick solid red";
		     [matrix, filterWindow] = selectFilterMatrix(filter);
		     drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, matrix, filterWindow);
		     for (var i = 0 ; i < filterWindow * filterWindow ; i++) {
			 document.getElementById("filterValue"+i).value = matrix[i];
		     }
		 } );
    // generate filter table dom
    var i = 0;
    for (var y = 0 ; y < filterWindow ; y++) {
	var tr = document.createElement("tr")
	filterMatrix.appendChild(tr);
	for (var x = 0 ; x < filterWindow ; x++) {
	    var td = document.createElement("td")
	    tr.appendChild(td);
	    var input = document.createElement("input")
	    td.appendChild(input);
	    input.type = "text";
	    input.id = "filterValue"+i;
	    input.size = 10;
	    input.value = matrix[i];
	    i++;
	}
    }
    for (var i = 0 ; i < filterWindow * filterWindow ; i++) {
	var map = {}
	map["filterValue"+i] = null;
	bindFunction(map,
		     function(target) {
			 var i = target.id.substr("filterValue".length);
			 matrix[i] = target.value;
			 drawSrcImageAndConvolution(srcImage, srcCanvas, dstCanvas, matrix, filterWindow);
		     });
    }
    console.log(filterMatrix);
}

function selectFilterMatrix(filter) {
    console.debug("selectFilterMatrix("+filter+")");
    var matrix = null;;
    var filterWindow = 3;
    switch (filter) {
    case "smoothing":
	var v = 1/9;
	matrix = [v, v, v,
		  v, v, v,
		  v, v, v];
	break;
    case "differentialHoli":
	matrix = [0, 0, 0,
		  0, -1, 1,
		  0, 0, 0];
	break;
    case "differentialVert":
	matrix = [0, 1, 0,
		  0, -1, 0,
		  0, 0, 0];
	break;
    case "differential":
	matrix = [0, 1, 0,
		  0, -2, 1,
		  0, 0, 0];
	break;
    case "laplacian":
	matrix = [0, 1, 0,
		  1, -4, 1,
		  0, 1, 0];
	break;
    case "sharpening1":
	matrix = [ 0, -1,  0,
		   -1,  5, -1,
		   0, -1,  0];
	break;
    case "sharpening2":
	matrix = [-1, -1, -1,
		  -1,  9, -1,
		  -1, -1, -1];
	break;
    case "emboss":
	matrix = [1, 0,  0,
		  0, 0,  0,
		  0, 0, -1];
	break;
    case "prewitt":
	matrix = [-2, -1, 0,
		  -1, 0,  1,
		  0, 1, 2];
	break;
    case "sobel":
	matrix = [-2, -2, 0,
		  -2,  0, 2,
		  0,  2, 2];
	break;
    default:
	console.error("Unknown filter:"+filter);
    }
    return [matrix, filterWindow];
}

function drawSrcImageAndConvolution(srcImage, srcCanvas, dstCancas, matrix, filterWindow) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawConvolution(srcCanvas, dstCanvas, matrix, filterWindow);
}

function convolution(srcImageData, srcX, srcY, matrix, convWindow) {
    var startX = srcX - (convWindow-1)/2, endX = startX + convWindow;
    var startY = srcY - (convWindow-1)/2, endY = startY + convWindow;
    var i = 0;
    var [r2, g2, b2, a2] = [0,0,0,0];
    for (var y = startY ; y < endY ; y++) {
	for (var x = startX ; x < endX ; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    r2 += r * matrix[i];
	    g2 += g * matrix[i];
	    b2 += b * matrix[i];
	    i++;
	}
    }
    return [r2, g2, b2, a];
}

function drawConvolution(srcCanvas, dstCanvas, matrix, filterWindow) {
    // console.debug("drawConvolution");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    var filter = document.getElementById("filterSelect").value;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgba = convolution(srcImageData, srcX, srcY, matrix, filterWindow);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
