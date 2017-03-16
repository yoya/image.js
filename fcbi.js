"use strict";
/*
 * 2017/03/03- (c) yoya@awm.jp
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
	    drawSrcImage(srcImage, srcCanvas);
	    drawFCBI(srcCanvas, dstCanvas);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    bindFunction("range2text", {"TMRange":"TMText",
				"phaseRange":"phaseText"},
		 function () { drawFCBI(srcCanvas, dstCanvas); }
		);
    bindFunction("checkbox", {"edgeModeCheckbox":null},
		 function () {
		     drawFCBI(srcCanvas, dstCanvas); }
		);
    bindFunction("range2text", {"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImage(srcImage, srcCanvas);
		     drawFCBI(srcCanvas, dstCanvas); }
		);
}


function drawSrcImage(srcImage, srcCanvas) {
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

var g_timeoutList = [];

function drawFCBI(srcCanvas, dstCanvas) {
    console.debug("drawFCBI");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth = dstCanvas.width = 2*srcWidth - 1;
    var dstHeight = dstCanvas.height = 2*srcHeight - 1;
    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    //
    var Context = function() {
	this.phase = 0;
	this.srcCanvas = srcCanvas;
	this.dstCanvas = dstCanvas;
	this.srcCtx = srcCtx;
	this.dstCtx = dstCtx;
	this.srcImageData = srcImageData;
	this.dstImageData = dstImageData;;
    }
    var ctx = new Context();
    var id = setTimeout(drawFCBI_.bind(ctx), 10); //フェイズ毎に描画させたい
    g_timeoutList.push(id); // for remove old process
}

function drawFCBI_() {
    console.debug("drawFCBI_ phase:" + this.phase);
    var srcCanvas = this.srcCanvas;
    var dstCanvas = this.dstCanvas;
    var dstCtx = this.dstCtx;
    var srcImageData = this.srcImageData;
    var dstImageData = this.dstImageData;
    while (1 < g_timeoutList.length) { // 最後の１つを残す
	var id = g_timeoutList.shift(); // リストの頭からキャンセル
	clearTimeout(id);
    }
    var TM = parseFloat(document.getElementById("TMRange").value);
    var edgeMode = document.getElementById("edgeModeCheckbox").checked;
    var phase = parseFloat(document.getElementById("phaseRange").value);
    // console.debug("TM,edgeMode,phase:", TM,edgeMode,phase);
    //
    switch (this.phase) {
    case 0: // リサンプル
	drawFCBI_Phase1(srcImageData, dstImageData, false);
	break;
    case 1:  // 対角成分補間
	drawFCBI_Phase2(dstImageData, TM, false);
	break;
    case 2: // 水平垂直成分補完
	drawFCBI_Phase3(dstImageData, TM, edgeMode)
	break;
    case 3: // 対角成分エッジ
	if (edgeMode) {
	    drawFCBI_Phase2(dstImageData, TM, edgeMode)
	}
	break;
    case 4: // エッジの隙間クリア
	if (edgeMode) {
	    drawFCBI_Phase1(srcImageData, dstImageData, edgeMode);
	}
	break;
    default:
	return ; // complete
    }
    this.phase ++;
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var id = setTimeout(drawFCBI_.bind(this), 10);
    g_timeoutList.push(id); // for remove old process
}

/*
 *  リサンプル(補間なし)
 */
function drawFCBI_Phase1(srcImageData, dstImageData, edgeMode) {
    var dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    for (var dstY = 0 ; dstY < dstHeight ; dstY+=2) {
        for (var dstX = 0 ; dstX < dstWidth ; dstX+=2) {
	    if (edgeMode) {
		var rgba = [128, 128, 128, 255]; // gray
	    } else {
		var srcX = dstX / 2;
		var srcY = dstY / 2;
		var rgba = getRGBA(srcImageData, srcX, srcY);
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * 対角成分補間
 */
function drawFCBI_Phase2(dstImageData, TM, edgeMode) {
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
	    var v1 = Math.abs(l1 - l4);
	    var v2 = Math.abs(l2 - l3);
	    var p1 = (l1 + l4) / 2;
	    var p2 = (l2 + l3) / 2;
	    if (((v1 < TM) && (v2 < TM) && (Math.abs(p1 - p2) < TM)) ||
		(Math.abs(v1 - v2) < TM)) { // yoya custom
		if (edgeMode) {
		    var rgba = [0, 128, 0, 255]; // green
		} else {
		    var l_m1m3 = getLuma(dstImageData, dstX-1, dstY-3);
		    var l_p1m3 = getLuma(dstImageData, dstX+1, dstY-3);
		    var l_m3m1 = getLuma(dstImageData, dstX-3, dstY-1);
		    // l_m1m1 = l1;
		    // l_p1m1 = l2;
		    var l_p3m1 = getLuma(dstImageData, dstX+3, dstY-1);
		    var l_m3p1 = getLuma(dstImageData, dstX-3, dstY+1);
		    // l_m1p1 = l3;
		    // l_p1p1 = l4;
		    var l_p3p1 = getLuma(dstImageData, dstX+3, dstY+1);
		    var l_m1p3 = getLuma(dstImageData, dstX-1, dstY+3);
		    var l_p1p3 = getLuma(dstImageData, dstX+1, dstY+3);

		    var h1 = (l_m3p1 + l1 + l_p1m3) - 3 * (l3 + l2) + (l_m1p3 + l4 + l_p3m1);
		    var h2 = (l_m1m3 + l2 + l_p3p1) - 3 * (l1 + l4) + (l_m3m1 + l3 + l_p1p3);
		    if (Math.abs(h1) < Math.abs(h2)) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else {
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    } else {
		if (edgeMode) {
		    var rgba = [255, 0, 0, 255]; // red
		} else {
		    if (v1 < v2) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else {
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
function drawFCBI_Phase3(dstImageData, TM, edgeMode) {
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
	    var v1 = Math.abs(l1 - l4);
	    var v2 = Math.abs(l2 - l3);
	    var p1 = (l1 + l4) / 2;
	    var p2 = (l2 + l3) / 2;
	    if (((v1 < TM) && (v2 < TM) && (Math.abs(p1 - p2) < TM)) ||
		(Math.abs(v1 - v2) < TM)) { // yoya custom
		if (edgeMode) {
		    var rgba = [0, 0, 255, 255]; // blue
		} else {
		    var l_m1m2 = getLuma(dstImageData, dstX-1, dstY-2);
		    var l_p1m2 = getLuma(dstImageData, dstX+1, dstY-2);
		    var l_m2m1 = getLuma(dstImageData, dstX-2, dstY-1);
		    // l_z0m1 = l2
		    var l_p2m1 = getLuma(dstImageData, dstX+2, dstY-1);
		    // l_m1z0 = l1
		    // l_p1z0 = l4
		    var l_m2p1 = getLuma(dstImageData, dstX-2, dstY+1);
		    // l_z0p1 = l3
		    var l_p2p1 = getLuma(dstImageData, dstX+2, dstY+1);
		    var l_m1p2 = getLuma(dstImageData, dstX-1, dstY+2);
		    var l_p1p2 = getLuma(dstImageData, dstX+1, dstY+2);

		    var h1 = (l_p1m2 + l4 + l_p1p2) - 3 * (l2 + l3) + (l_m1m2 + l1 + l_m1p2)
		    var h2 = (l_m2m1 + l2 + l_p2m1) - 3 * (l1 + l4) + (l_m2p1 + l3 + l_p2p1);
		    if (Math.abs(h1) < Math.abs(h2)) {
			var rgba = meanRGBA(rgba1, rgba4);
		    } else {
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    } else {
		if (edgeMode) {
		    var rgba = [255, 255, 0, 255]; // yellow
		} else {
		    if (v1 < v2) {
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
