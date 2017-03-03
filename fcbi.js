"use strict";
/*
 * 2017/03/03- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var srcCanvas = document.getElementById("srcCanvas");
var dstCanvas = document.getElementById("dstCanvas");
var srcImage = new Image(srcCanvas.width, srcCanvas.height);

function main() {
    // console.debug("main");
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImage();
	    drawEdge();
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", {"TMRange":"TMText",
				"edgeRange":"edgeText",
				"phaseRange":"phaseText"}, drawEdge);
    bindFunction("range2text", {"maxWidthRange":"maxWidthText",
				"maxHeightRange":"maxHeightText"}, function() {
	drawSrcImage();
	drawEdge();
    });
}


function drawSrcImage() {
    // console.debug("drawSrcImage");
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    var maxWidth = parseFloat(document.getElementById("maxWidthRange").value);
    var maxHeight = parseFloat(document.getElementById("maxHeightRange").value);
    if ((maxWidth < width) || (maxHeight < height)) {
	var resizeScaleWidth = maxWidth / width;
	var resizeScaleHeight = maxHeight / height;
	var resizeScale = (resizeScaleWidth < resizeScaleHeight)?resizeScaleWidth:resizeScaleHeight;
	width *= resizeScale;
	height *= resizeScale;
    }
    srcCanvas.width  = width;
    srcCanvas.height = height;
    srcCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
}

function clamp(x, min, max) {
    if (min <= x) {
	if (x <= max) {
	    return x;
	}
	return max;
    }
    return min;
}

function getRGBA(imageData, x, y) {
    var width = imageData.width, height = imageData.height;
    x = clamp(x, 0, width -1);
    y = clamp(y, 0, height - 1);
    var offset = 4 * (x + y * width);
    return imageData.data.slice(offset, offset+4);
}
function setRGBA(imageData, x, y, rgba) {
    var offset = 4 * (x + y * imageData.width);
    var data = imageData.data;
    data[offset++] = rgba[0];
    data[offset++] = rgba[1];
    data[offset++] = rgba[2];
    data[offset++] = rgba[3];
}
function getLuma(imageData, x, y) {
    var [r,g,b,a] = getRGBA(imageData, x, y);
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y * a; // XXX y or y * a
}
function FilterMultiply(imageData, x, y, posi, filter) {
    var h = 0;
    for (var i=0, n = posi.length ; i < n ; i++) {
	var xy = posi[i];
	var xx = x + xy[0], yy = y + xy[1];
	h += getLuma(imageData, xx, yy) * filter[i];
    }
    return h;
}

function meanRGBA(rgba1, rgba2) {
    var [r1,g1,b1,a1] = rgba1;
    var [r2,g2,b2,a2] = rgba2;
    return [(r1+r2)/2, (g1+g2)/2, (b1+b2)/2, (a1+a2)/2];
}

function drawEdge() {
    // console.debug("drawEdge");
    var TM = parseFloat(document.getElementById("TMRange").value);
    TM *= 256;
    var edge = parseFloat(document.getElementById("edgeRange").value);
    var phase = parseFloat(document.getElementById("phaseRange").value);
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = dstCanvas.width = 2*srcWidth - 1;
    var dstHeight = dstCanvas.height = 2*srcHeight - 1;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    // リサンプル
    for (var dstY = 0 ; dstY < dstHeight; dstY+=2) {
        for (var dstX = 0 ; dstX < dstWidth; dstX+=2) {
	    var srcX = dstX/2;
	    var srcY = dstY/2;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    if (phase > 1) {
	// 対角成分
	for (var dstY = 1 ; dstY < dstHeight; dstY+=2) {
            for (var dstX = 1 ; dstX < dstWidth; dstX+=2) {
		/*  l1     l2
		 *      x  
		 *  l3     l4
		 */
		var l1 = getLuma(dstImageData, dstX-1, dstY-1);
		var l2 = getLuma(dstImageData, dstX+1, dstY-1);
		var l3 = getLuma(dstImageData, dstX-1, dstY+1);
		var l4 = getLuma(dstImageData, dstX+1, dstY+1);
		var V1 = Math.abs(l1 - l4);
		var V2 = Math.abs(l2 - l3);
		var p1 = (l1 + l4) / 2;
		var p2 = (l2 + l3) / 2;
		if ((V1 < TM) && (V2 < TM) && (Math.abs(p1 - p2) < TM)) {
		    if (edge) {
			var rgba = [255, 0, 0, 255];
		    } else {
			var H1 = FilterMultiply(dstImageData, dstX, dstY,
						[[-3, 1],[-1, -1], [1, -3], // 1,2,3
						 [-1, 1], [1, -1],          // 4, 5
						 [-1, 3], [1,1], [3, -1]],  // 6, 7, 8
						[1, 1, 1, -3, -3, 1, 1, 1]); // filter
			var H2 = FilterMultiply(dstImageData, dstX, dstY,
						[[-1, -3],[1, 1], [3, 1],   // 1,2,3
						 [-1, -1], [1, 1],          // 4, 5
						 [-3, -1], [-1,1], [1, 3]], // 6, 7, 8
						[1, 1, 1, -3, -3, 1, 1, 1]); // filter
			if (H1 < H2) {
			    var rgba1 = getRGBA(dstImageData, dstX-1, dstY-1);
			    var rgba4 = getRGBA(dstImageData, dstX+1, dstY+1);
			    var rgba = meanRGBA(rgba1, rgba4);
			} else {
			    var rgba2 = getRGBA(dstImageData, dstX-1, dstY+1);
			    var rgba3 = getRGBA(dstImageData, dstX+1, dstY-1);
			    var rgba = meanRGBA(rgba2, rgba3);
			}
		    }
		} else {
		    if (edge) {
			var rgba = [0, 255, 0, 255];
		    } else {
			if (V1 < V2) {
			    var rgba1 = getRGBA(dstImageData, dstX-1, dstY-1);
			    var rgba4 = getRGBA(dstImageData, dstX+1, dstY+1);
			    var rgba = meanRGBA(rgba1, rgba4);
			} else{
			    var rgba2 = getRGBA(dstImageData, dstX-1, dstY+1);
			    var rgba3 = getRGBA(dstImageData, dstX+1, dstY-1);
			    var rgba = meanRGBA(rgba2, rgba3);
			}
		    }
		}
		setRGBA(dstImageData, dstX, dstY, rgba);
	    }
	}
    } if (phase > 2) {
	// 水平垂直成分
	for (var dstY = 0 ; dstY < dstHeight; dstY++) {
            for (var dstX = 1 - (dstY%2) ; dstX < dstWidth; dstX+=2) {
		/*     l2
		 *  l1  x  l4
		 *     l3
		 */
		var l1 = getLuma(dstImageData, dstX-1, dstY);
		var l2 = getLuma(dstImageData, dstX, dstY-1);
		var l3 = getLuma(dstImageData, dstX, dstY+1);
		var l4 = getLuma(dstImageData, dstX+1, dstY);
		var V1 = Math.abs(l1 - l4);
		var V2 = Math.abs(l2 - l3);
		var p1 = (l1 + l4) / 2;
		var p2 = (l2 + l3) / 2;
		if ((V1 < TM) && (V2 < TM) && (Math.abs(p1 - p2) < TM)) {
		    if (edge) {
			var rgba = [0, 0, 255, 255];
		    } else {
			var H1 = FilterMultiply(dstImageData, dstX, dstY,
						[[1, -2],[1, 0], [1, 2],     // 1,2,3
						 [0, -1], [0, 1],            // 4, 5
						 [-1, -2], [-1,0], [-1, 2]], // 6, 7, 8
						[1, 1, 1, -3, -3, 1, 1, 1]); // filter
			var H2 = FilterMultiply(dstImageData, dstX, dstY,
						[[-2, -1],[0, -1], [2, -1],  // 1,2,3
						 [-1, 0], [1, 0],          // 4, 5
						 [-2, 1], [0,1], [2, 1]], // 6, 7, 8
						[1, 1, 1, -3, -3, 1, 1, 1]); // filter
			if (H1 < H2) {
			    var rgba2 = getRGBA(dstImageData, dstX, dstY-1);
			    var rgba3 = getRGBA(dstImageData, dstX, dstY+1);
			    var rgba = meanRGBA(rgba2, rgba3);
			} else {
			    var rgba1 = getRGBA(dstImageData, dstX-1, dstY);
			    var rgba4 = getRGBA(dstImageData, dstX+1, dstY);
			    var rgba = meanRGBA(rgba1, rgba4);
			}
		    }
		} else {
		    if (edge) {
	    		var rgba = [255, 255, 0, 255];
		    } else {
			if (V1 < V2) {
			    var rgba1 = getRGBA(dstImageData, dstX-1, dstY);
			    var rgba4 = getRGBA(dstImageData, dstX+1, dstY);
			    var rgba = meanRGBA(rgba1, rgba4);
			} else{
			    var rgba2 = getRGBA(dstImageData, dstX, dstY-1);
			    var rgba3 = getRGBA(dstImageData, dstX, dstY+1);
			    var rgba = meanRGBA(rgba2, rgba3);
			}
		    }
		}
		setRGBA(dstImageData, dstX, dstY, rgba);
	    }
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}
