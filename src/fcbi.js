'use strict';
/*
 * 2017/03/03- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
	    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
	    drawFCBI(srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'TMRange':'TMText',
		  'phaseLimitRange':'phaseLimitText',
		  'edgeModeCheckbox':null
},
		 function () { drawFCBI(srcCanvas, dstCanvas); }
		);
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
		     drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
		     drawFCBI(srcCanvas, dstCanvas);
}
		);
}

function meanRGBA(rgba1, rgba2) {
    const [r1, g1, b1, a1] = rgba1;
    const [r2, g2, b2, a2] = rgba2;
    return [(r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2, (a1 + a2) / 2];
}

const g_timeoutList = [];

function drawFCBI(srcCanvas, dstCanvas) {
    console.debug('drawFCBI');
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth = dstCanvas.width = 2 * srcWidth - 1;
    const dstHeight = dstCanvas.height = 2 * srcHeight - 1;
    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (let i = 3, n = 4 * dstWidth * dstHeight; i < n; i += 4) {
	dstImageData[i] = 255;
    }
    const TM = parseFloat(document.getElementById('TMRange').value);
    const edgeMode = document.getElementById('edgeModeCheckbox').checked;
    const phaseLimit = parseFloat(document.getElementById('phaseLimitRange').value);
    //
    const Context = function() {
	// progress number
	this.phase = 0;
	// canvas object
	this.srcCanvas = srcCanvas;
	this.dstCanvas = dstCanvas;
	this.srcCtx = srcCtx;
	this.dstCtx = dstCtx;
	this.srcImageData = srcImageData;
	this.dstImageData = dstImageData;
	// input params
	this.TM = TM;
	this.edgeMode = edgeMode;
	this.phaseLimit = phaseLimit;
    };
    const ctx = new Context();
    const id = setTimeout(drawFCBI_.bind(ctx), 10); // フェイズ毎に描画させたい
    g_timeoutList.push(id); // for remove old process
}

function drawFCBI_() {
    console.debug('drawFCBI_ phase:' + this.phase);
    const srcCanvas = this.srcCanvas;
    const dstCanvas = this.dstCanvas;
    const dstCtx = this.dstCtx;
    const srcImageData = this.srcImageData;
    const dstImageData = this.dstImageData;
    const TM = this.TM;
    const edgeMode = this.edgeMode;
    const phaseLimit = this.phaseLimit;
    while (g_timeoutList.length > 1) { // 最後の１つを残す
	var id = g_timeoutList.shift(); // リストの頭からキャンセル
	clearTimeout(id);
    }
    // console.debug("TM,edgeMode,phase:", TM,edgeMode,phase);
    //
    switch (this.phase) {
    case 0: // リサンプル
	drawFCBI_Phase1(srcImageData, dstImageData, false);
	break;
    case 1:  // 対角成分補間
	if (phaseLimit > 1) {
	    if (phaseLimit === 2) {
		drawFCBI_Phase2(dstImageData, TM, edgeMode);
	    } else {
		drawFCBI_Phase2(dstImageData, TM, false);
	    }
	}
	break;
    case 2: // 水平垂直成分補完
	if (phaseLimit > 2) {
	    drawFCBI_Phase3(dstImageData, TM, edgeMode);
	}
	break;
    case 3: // 対角成分エッジ
	if (phaseLimit > 2) {
	    if (edgeMode) {
		drawFCBI_Phase2(dstImageData, TM, edgeMode);
	    }
	}
	break;
    case 4: // エッジの隙間クリア
	if (edgeMode) {
	    drawFCBI_Phase1(srcImageData, dstImageData, edgeMode);
	}
	break;
    default:
	return; // complete
    }
    this.phase++;
    dstCtx.putImageData(dstImageData, 0, 0);
    //
    var id = setTimeout(drawFCBI_.bind(this), 10);
    g_timeoutList.push(id); // for remove old process
}

/*
 *  リサンプル(補間なし)
 */
function drawFCBI_Phase1(srcImageData, dstImageData, edgeMode) {
    const dstWidth = dstImageData.width; const dstHeight = dstImageData.height;
    for (let dstY = 0; dstY < dstHeight; dstY += 2) {
        for (let dstX = 0; dstX < dstWidth; dstX += 2) {
	    if (edgeMode) {
		var rgba = [0, 0, 0, 255]; // black
	    } else {
		const srcX = dstX / 2;
		const srcY = dstY / 2;
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
    const dstWidth = dstImageData.width; const dstHeight = dstImageData.height;
    for (let dstY = 1; dstY < dstHeight; dstY += 2) {
        for (let dstX = 1; dstX < dstWidth; dstX += 2) {
	    /*  l1     l2
	     *      x
	     *  l3     l4
	     */
	    const rgba1 = getRGBA(dstImageData, dstX - 1, dstY - 1);
	    const rgba2 = getRGBA(dstImageData, dstX + 1, dstY - 1);
	    const rgba3 = getRGBA(dstImageData, dstX - 1, dstY + 1);
	    const rgba4 = getRGBA(dstImageData, dstX + 1, dstY + 1);
	    const l1 = lumaFromRGBA(rgba1);
	    const l2 = lumaFromRGBA(rgba2);
	    const l3 = lumaFromRGBA(rgba3);
	    const l4 = lumaFromRGBA(rgba4);
	    const v1 = Math.abs(l1 - l4);
	    const v2 = Math.abs(l2 - l3);
	    const p1 = (l1 + l4) / 2;
	    const p2 = (l2 + l3) / 2;
	    if (((v1 < TM) && (v2 < TM) && (Math.abs(p1 - p2) < TM)) ||
		(Math.abs(v1 - v2) < TM)) { // yoya custom
		if (edgeMode) {
		    var rgba = [0, 128, 0, 255]; // green
		} else {
		    const l_m1m3 = getLuma(dstImageData, dstX - 1, dstY - 3);
		    const l_p1m3 = getLuma(dstImageData, dstX + 1, dstY - 3);
		    const l_m3m1 = getLuma(dstImageData, dstX - 3, dstY - 1);
		    // l_m1m1 = l1;
		    // l_p1m1 = l2;
		    const l_p3m1 = getLuma(dstImageData, dstX + 3, dstY - 1);
		    const l_m3p1 = getLuma(dstImageData, dstX - 3, dstY + 1);
		    // l_m1p1 = l3;
		    // l_p1p1 = l4;
		    const l_p3p1 = getLuma(dstImageData, dstX + 3, dstY + 1);
		    const l_m1p3 = getLuma(dstImageData, dstX - 1, dstY + 3);
		    const l_p1p3 = getLuma(dstImageData, dstX + 1, dstY + 3);

		    const h1 = (l_m3p1 + l1 + l_p1m3) - 3 * (l3 + l2) + (l_m1p3 + l4 + l_p3m1);
		    const h2 = (l_m1m3 + l2 + l_p3p1) - 3 * (l1 + l4) + (l_m3m1 + l3 + l_p1p3);
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
    const dstWidth = dstImageData.width; const dstHeight = dstImageData.height;
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 1 - (dstY % 2); dstX < dstWidth; dstX += 2) {
	    /*     l2
	     *  l1  x  l4
	     *     l3
	     */
	    const rgba1 = getRGBA(dstImageData, dstX - 1, dstY);
	    const rgba2 = getRGBA(dstImageData, dstX, dstY - 1);
	    const rgba3 = getRGBA(dstImageData, dstX, dstY + 1);
	    const rgba4 = getRGBA(dstImageData, dstX + 1, dstY);
	    const l1 = lumaFromRGBA(rgba1);
	    const l2 = lumaFromRGBA(rgba2);
	    const l3 = lumaFromRGBA(rgba3);
	    const l4 = lumaFromRGBA(rgba4);
	    const v1 = Math.abs(l1 - l4);
	    const v2 = Math.abs(l2 - l3);
	    const p1 = (l1 + l4) / 2;
	    const p2 = (l2 + l3) / 2;
	    if (((v1 < TM) && (v2 < TM) && (Math.abs(p1 - p2) < TM)) ||
		(Math.abs(v1 - v2) < TM)) { // yoya custom
		if (edgeMode) {
		    var rgba = [0, 0, 255, 255]; // blue
		} else {
		    const l_m1m2 = getLuma(dstImageData, dstX - 1, dstY - 2);
		    const l_p1m2 = getLuma(dstImageData, dstX + 1, dstY - 2);
		    const l_m2m1 = getLuma(dstImageData, dstX - 2, dstY - 1);
		    // l_z0m1 = l2
		    const l_p2m1 = getLuma(dstImageData, dstX + 2, dstY - 1);
		    // l_m1z0 = l1
		    // l_p1z0 = l4
		    const l_m2p1 = getLuma(dstImageData, dstX - 2, dstY + 1);
		    // l_z0p1 = l3
		    const l_p2p1 = getLuma(dstImageData, dstX + 2, dstY + 1);
		    const l_m1p2 = getLuma(dstImageData, dstX - 1, dstY + 2);
		    const l_p1p2 = getLuma(dstImageData, dstX + 1, dstY + 2);

		    const h1 = (l_p1m2 + l4 + l_p1p2) - 3 * (l2 + l3) + (l_m1m2 + l1 + l_m1p2);
		    const h2 = (l_m2m1 + l2 + l_p2m1) - 3 * (l1 + l4) + (l_m2p1 + l3 + l_p2p1);
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
		    } else {
			var rgba = meanRGBA(rgba2, rgba3);
		    }
		}
	    }
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}
