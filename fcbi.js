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
	    drawFCBI();
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", {"TMRange":"TMText",
				"phaseRange":"phaseText"}, drawFCBI);
    bindFunction("checkbox", {"edgeCheckbox":null}, drawFCBI);
    bindFunction("range2text", {"maxWidthHeightRange":"maxWidthHeightText"},
		 function() { drawSrcImage(); drawFCBI(); } );
}


function drawSrcImage() {
    // console.debug("drawSrcImage");
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	var resizeScale = maxWidthHeight / ((width > height)?width:height);
	width  *= resizeScale;
	height *= resizeScale;
    }
    srcCanvas.width  = width;
    srcCanvas.height = height;
    srcCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
}

function clamp(x, min, max) {
    if (min < x) {
	return (x < max)? x : max;
    }
    return min;
}

function getRGBA(imageData, x, y) {
    var width = imageData.width, height = imageData.height;
    x = clamp(x, 0, width - 1);
    y = clamp(y, 0, height - 1);
    var offset = 4 * (x + y * width);
    return imageData.data.slice(offset, offset + 4);
}
function setRGBA(imageData, x, y, rgba) {
    var offset = 4 * (x + y * imageData.width);
    var data = imageData.data;
    data[offset++] = rgba[0];
    data[offset++] = rgba[1];
    data[offset++] = rgba[2];
    data[offset++] = rgba[3];
}
function meanRGBA(rgba1, rgba2) {
    var [r1,g1,b1,a1] = rgba1;
    var [r2,g2,b2,a2] = rgba2;
    return [(r1+r2)/2, (g1+g2)/2, (b1+b2)/2, (a1+a2)/2];
}
function lumaFromRGBA(rgba) {
    var [r,g,b,a] = rgba;
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y * a / 255;
    // return y;
}
function getLuma(imageData, x, y) {
    var rgba = getRGBA(imageData, x, y);
    return lumaFromRGBA(rgba);
}
function FilterMultiply(imageData, x, y, posi, filter) {
    var h = 0;
    for (var i = 0, n = posi.length ; i < n ; i++) {
	var [dx, dy] = posi[i];
	h += getLuma(imageData, x + dx, y + dy) * filter[i];
    }
    return h;
}

function drawFCBI() {
    var Context = function() {
	this.phase = 0;
	this.srcImageData = null;
	this.dstImageData = null;
    }
    var ctx = new Context();
    for (var i=0 ; i < 5 ; i++) {
	setTimeout(drawFCBI_.bind(ctx), 1);
    }
}
function drawFCBI_() {
    console.debug("drawFCBI:" + this.phase);
    var TM = parseFloat(document.getElementById("TMRange").value);
    var edge = document.getElementById("edgeCheckbox").checked;
    var phase = parseFloat(document.getElementById("phaseRange").value);
    // console.debug("TM,edge,phase:", TM,edge,phase);
    //
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = dstCanvas.width = 2*srcWidth - 1;
    var dstHeight = dstCanvas.height = 2*srcHeight - 1;
    //
    if (this.srcImageData !== null) {
	var srcImageData = this.srcImageData;
	var dstImageData = this.dstImageData;
    } else {
	var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
	this.srcImageData = srcImageData;
	this.dstImageData = dstImageData;
    }
    var srcData = srcImageData.data;
    var dstData = dstImageData.data;
    // リサンプル
    if (this.phase < 1) {
	drawFCBI_Phase1(srcImageData, dstImageData, false);
	dstCtx.putImageData(dstImageData, 0, 0);
	this.phase = 1;
	return ;
    }
    if (phase > 1) {
	// 対角成分補間
	if (this.phase < 2) {
	    drawFCBI_Phase2(dstImageData, TM, false);
	    dstCtx.putImageData(dstImageData, 0, 0);
	    this.phase = 2;
	    return ;
	}
	if (phase > 2) {
	    // 水平垂直成分補完
	    if (this.phase < 3) {
		drawFCBI_Phase3(dstImageData, TM, edge)
		dstCtx.putImageData(dstImageData, 0, 0);
		this.phase = 3;
		return ;
	    }
	    if (edge) {
		if (this.phase < 4) {
		    drawFCBI_Phase2(dstImageData, TM, edge)
		    dstCtx.putImageData(dstImageData, 0, 0);
		    this.phase = 4;
		    return ;
		}
	    }
	}
	if (edge) {
	    drawFCBI_Phase1(srcImageData, dstImageData, edge);
	    dstCtx.putImageData(dstImageData, 0, 0);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

/*
 *  リサンプル(補間なし)
 */
function drawFCBI_Phase1(srcImageData, dstImageData, edge) {
    var dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    for (var dstY = 0 ; dstY < dstHeight; dstY+=2) {
        for (var dstX = 0 ; dstX < dstWidth; dstX+=2) {
	    if (edge) {
		var rgba = [0, 0, 0, 255];
	    } else {
		var srcX = dstX/2;
		var srcY = dstY/2;
		var rgba = getRGBA(srcImageData, srcX, srcY);
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * 対角成分補間
 */
function drawFCBI_Phase2(dstImageData, TM, edge) {
    var dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    for (var dstY = 1 ; dstY < dstHeight; dstY+=2) {
        for (var dstX = 1 ; dstX < dstWidth; dstX+=2) {
	    /*  l1     l2
	     *      x  
	     *  l3     l4
	     */
	    var rgba1 = getRGBA(dstImageData, dstX-1, dstY-1);
	    var rgba2 = getRGBA(dstImageData, dstX+1, dstY-1);
	    var rgba3 = getRGBA(dstImageData, dstX-1, dstY+1);
	    var rgba4 = getRGBA(dstImageData, dstX+1, dstY+1);
	    var l1 = lumaFromRGBA(rgba1);
	    var l2 = lumaFromRGBA(rgba2);
	    var l3 = lumaFromRGBA(rgba3);
	    var l4 = lumaFromRGBA(rgba4);
	    var V1 = Math.abs(l1 - l4);
	    var V2 = Math.abs(l2 - l3);
	    var p1 = (l1 + l4) / 2;
	    var p2 = (l2 + l3) / 2;
	    if ((V1 < TM) && (V2 < TM) && (Math.abs(p1 - p2) < TM)) {
		if (edge) {
		    var rgba = [0, 128, 0, 255]; // green
		} else {
		    var H1 = FilterMultiply(dstImageData, dstX, dstY,
					    [[-3, 1], [-1,-1], [1, -3],  // 1, 2, 3
					     [-1, 1],          [1, -1],  // 4,    5
					     [-1, 3], [ 1, 1], [3, -1]], // 6, 7, 8
					    [1, 1, 1, -3, -3, 1, 1, 1]); // filter
		    var H2 = FilterMultiply(dstImageData, dstX, dstY,
					    [[-1, -3], [1, -1], [3, 1],  // 1, 2, 3
					     [-1, -1],          [1, 1],  // 4,    5
					     [-3, -1], [-1, 1], [1, 3]], // 6, 7, 8
					    [1, 1, 1, -3, -3, 1, 1, 1]); // filter
		    if (H1 < H2) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else {
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    } else {
		if (edge) {
		    var rgba = [255, 0, 0, 255]; // red
		} else {
		    if (V1 < V2) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else{
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * 水平垂直成分補完
 */
function drawFCBI_Phase3(dstImageData, TM, edge) {
    var dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 1 - (dstY%2) ; dstX < dstWidth; dstX+=2) {
	    /*     l2
	     *  l1  x  l4
	     *     l3
	     */
	    var rgba1 = getRGBA(dstImageData, dstX-1, dstY);
	    var rgba2 = getRGBA(dstImageData, dstX  , dstY-1);
	    var rgba3 = getRGBA(dstImageData, dstX  , dstY+1);
	    var rgba4 = getRGBA(dstImageData, dstX+1, dstY);
	    var l1 = lumaFromRGBA(rgba1);
	    var l2 = lumaFromRGBA(rgba2);
	    var l3 = lumaFromRGBA(rgba3);
	    var l4 = lumaFromRGBA(rgba4);
	    var V1 = Math.abs(l1 - l4);
	    var V2 = Math.abs(l2 - l3);
	    var p1 = (l1 + l4) / 2;
	    var p2 = (l2 + l3) / 2;
	    if ((V1 < TM) && (V2 < TM) && (Math.abs(p1 - p2) < TM)) {
		if (edge) {
		    var rgba = [0, 0, 255, 255]; // blue
		} else {
		    var H1 = FilterMultiply(dstImageData, dstX, dstY,
					    [[1, -2], [1, 0], [1, 2],    // 1, 2, 3
					     [0, -1],         [0, 1],    // 4,    5
					     [-1,-2], [-1,0], [-1, 2]],  // 6, 7, 8
					    [1, 1, 1, -3, -3, 1, 1, 1]); // filter
		    var H2 = FilterMultiply(dstImageData, dstX, dstY,
					    [[-2,-1], [0,-1], [2, -1],   // 1, 2, 3
					     [-1, 0],         [1,  0],   // 4,    5
					     [-2, 1], [0, 1], [2,  1]],  // 6, 7, 8
					    [1, 1, 1, -3, -3, 1, 1, 1]); // filter
		    if (H1 <= H2) {
			var rgba = meanRGBA(rgba2, rgba3);
		    } else {
			var rgba = meanRGBA(rgba1, rgba4);
		    }
		}
	    } else {
		if (edge) {
		    var rgba = [255, 255, 0, 255]; // yellow
		} else {
		    if (V1 < V2) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else{
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}
