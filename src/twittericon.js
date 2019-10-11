'use strict';
/*
 * 2017/06/16- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    let overlapImage = null;
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    const bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
'maxWidthHeightRange':'maxWidthHeightText',
		  'guideCheckbox':null,
		  'guideColorText':null,
		  'outfillSelect':null,
		  'projSelect':null,
		  'srcProjXRange':'srcProjXText',
		  'srcProjYRange':'srcProjYText',
		  'srcProjRRange':'srcProjRText'
},
		 function(e) {
		     // console.debug(e);
		     const bilinear = false;
		     drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
					    bilinear, overlapImage);
		 });
    bindFunction({ 'bilinearButton':null },
		 function(e) {
		     // console.debug(e);
		     const bilinear = true;
		     drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
					    bilinear, overlapImage);
		 });

    const loadOverlapImage = function(file) {
	const image = new Image();
	image.onload = function() {
	    overlapImage = image;
	    const bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
	};
	image.src = file;
    };
    const selectOverlapImage = function(overlap) {
	console.log(overlap);
	if (overlap === 'none') {
	    overlapImage = null;
	    const bilinear = false;
	    drawSrcImageAndConvert(srcImage, srcCanvas, dstCanvas,
				   bilinear, overlapImage);
	} else {
	    let file = null;
	    let url = null;
	    switch (overlap) {
	    case 'badge':
		file = 'img/badge.png';
		url = 'https://twitter.com/_hp23/status/875773014750543873';
		break;
	    case 'scope':
		file = 'img/scope.png';
		url = 'https://twitter.com/KulasanM/status/875611714959556609';
		break;
	    case 'clockBlue':
		file = 'img/clockBlue.png';
		url = 'https://twitter.com/device1020/status/875663435253415936';
		break;
	    case 'clockYellow':
		file = 'img/clockYellow.png';
		url = 'https://twitter.com/device1020/status/875663435253415936';
		break;
	    case 'clockRed':
		file = 'img/clockRed.png';
		url = 'https://twitter.com/device1020/status/875663435253415936';
		break;
	    case 'bubbleSoap':
		file = 'img/bubbleSoap.png';
		url = 'https://twitter.com/NnAone2cmg/status/875738100973969408';
		break;
	    case 'bubbleCyan':
		file = 'img/bubbleCyan.png';
		url = 'https://twitter.com/NnAone2cmg/status/875989771562106881';
		break;
	    case 'bubbleMagenta':
		file = 'img/bubbleMagenta.png';
		url = 'https://twitter.com/NnAone2cmg/status/875990875578302464';
		break;
	    case 'bubbleGreen':
		file = 'img/bubbleGreen.png';
		url = 'https://twitter.com/NnAone2cmg/status/875990875578302464';
		break;
	    case 'bubbleBlue':
		file = 'img/bubbleBlue.png';
		url = 'https://twitter.com/NnAone2cmg/status/875989771562106881';
		break;
	    case 'bubbleRainbow':
		file = 'img/bubbleRainbow.png';
		url = 'https://twitter.com/NnAone2cmg/status/876103882752917505';
		break;
	    default:
		console.error('Unknown overlap:' + overlap);
		return;
	    }
	    loadOverlapImage(file);
	    if (url !== null) {
		const html = 'Theme Image (c) <a href="' + url + '" target="_blank"\> ' + url + ' </a>';
		console.log(html);
		document.getElementById('imageCopyright').innerHTML = html;
	    }
	}
    };
    bindFunction({ 'overlapSelect':null },
		 function(e) {
		     // console.debug(e);
		     const overlap = document.getElementById('overlapSelect').value;
		     selectOverlapImage(overlap);
		 });
}
function drawSrcImageAndConvert(srcImage, srcCanvas, dstCancas,
				bilinear, overlapImage) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const guide = document.getElementById('guideCheckbox').checked;
    const guideColor = document.getElementById('guideColorText').value;
    let outfill = document.getElementById('outfillSelect').value;
    outfill = outfillStyleNumber(outfill);
    const proj = document.getElementById('projSelect').value;
    const srcProjX = parseFloat(document.getElementById('srcProjXRange').value);
    const srcProjY = parseFloat(document.getElementById('srcProjYRange').value);
    const srcProjR = parseFloat(document.getElementById('srcProjRRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawConvert(srcCanvas, dstCanvas, bilinear, outfill, guide, guideColor,
		proj, srcProjX, srcProjY, srcProjR,
		overlapImage);
}

function getRGBA_NN(imageData, x, y, outfill) {
    return getRGBA(imageData, Math.round(x), Math.round(y), outfill);
}

function linearRatio([a, b], p) {
    if (a === b) {
	return [0.5, 0.5];
    }
    const aRatio = (b - p) / (b - a);
    return [aRatio, 1 - aRatio];
}

function getRGBA_BL(imageData, x, y, outfill) {
    const data = imageData.data;
    const width  = imageData.width;
    const height = imageData.height;
    let x1 = Math.floor(x); let x2 = Math.ceil(x);
    let y1 = Math.floor(y); let y2 = Math.ceil(y);
    if (x1 < 0) {
	x1 = 0;
    } else if (width <= x2) {
	x2 = width - 1;
    }
    if (y1 < 0) {
	y1 = 0;
    } else if (height <= y2) {
	y2 = height - 1;
    }
    const rgba = [0, 0, 0, 0];
    const [rx1, rx2] = linearRatio([x1, x2], x);
    const [ry1, ry2] = linearRatio([y1, y2], y);
    const r11 = rx1 * ry1;
    const r12 = rx1 * ry2;
    const r21 = rx2 * ry1;
    const r22 = rx2 * ry2;
    const rgba11 = getRGBA(imageData, x1, y1, outfill);
    const rgba12 = getRGBA(imageData, x1, y2, outfill);
    const rgba21 = getRGBA(imageData, x2, y1, outfill);
    const rgba22 = getRGBA(imageData, x2, y2, outfill);
    for (let i = 0; i < 4; i++) {
	rgba[i] = r11 * rgba11[i] +  r12 * rgba12[i] +
	    r21 * rgba21[i] + r22 * rgba22[i];
    }
    return rgba;
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
	var rgba = [255, 255, 255, 0];
    }
    return rgba;
}

function drawConvert(srcCanvas, dstCanvas, bilinear, outfill, guide, guideColor,
		     proj, srcProjX, srcProjY, srcProjR,
		     overlapImage) {
    // console.debug("drawConvert");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const guideRGBA = getRGBAfromHexColor(guideColor);
    dstCanvas.style.backgroundColor = 'white';
    if (proj === 'normal') {
	const radius = Math.sqrt(srcWidth * srcWidth + srcHeight * srcHeight) / 2;
	var dstWidth  = Math.ceil(radius * 2);
	var dstHeight = dstWidth;
	dstCanvas.width  = dstWidth;
	dstCanvas.height = dstHeight;
	var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
	var dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
	//
	const scale = dstWidth / 2 / radius / srcProjR;
	// console.log( Math.round(x1), Math.round(y1) );
	for (var dstY = 0; dstY < dstHeight; dstY++) {
            for (var dstX = 0; dstX < dstWidth; dstX++) {
		var dx = dstX - dstWidth / 2;
		var dy = dstY - dstHeight / 2;
		if (guide && (dstWidth * dstHeight < 4 * (dx * dx + dy * dy))) {
		    var rgba = guideRGBA;
		} else {
		    var srcX = dx  / scale + srcWidth * srcProjX;
		    var srcY = dy / scale + srcHeight * (1 - srcProjY);
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
	for (var dstY = 0; dstY < dstHeight; dstY++) {
            for (var dstX = 0; dstX < dstWidth; dstX++) {
		const kk = dstWidth * 0.5;
		const ll = dstHeight * 0.5;
		const sr = Math.min(kk, ll);
		var dx = dstX - kk;
		var dy = dstY - ll;
		const rr = Math.hypot(dx, dy);
		if (rr < sr) {
		    if (proj === 'fisheye') {
			var pr = 1 - 2 * Math.acos(rr / sr) / Math.PI;
		    } else { // doom
			var pr = 2 - 4 * (0.5 - Math.atan2(rr, sr) / Math.PI);
		    }
		    pr *= srcProjR;
		    var px = (rr == 0.0) ? 0.0 : (pr * dx * sr / rr);
		    var py = (rr == 0.0) ? 0.0 : (pr * dy * sr / rr);
		    var srcX = px + srcWidth * srcProjX;
		    var srcY = py + srcHeight * (1 - srcProjY);
		    if (bilinear) {
			var rgba = getRGBA_BL(srcImageData, srcX, srcY, outfill);
		    } else {
			var rgba = getRGBA_NN(srcImageData, srcX, srcY, outfill);
		    }
		} else if (guide) {
		    var rgba = guideRGBA;
		} else {
		    if (outfill === OUTFILL_WHITE) {
		    var rgba = [255, 255, 255, 255];
		    } else if (outfill === OUTFILL_BLACK) {
			var rgba = [0, 0, 0, 255];
		    } else {
			if (proj === 'fisheye') {
			    var pr = 1 - 2 * Math.acos(1) / Math.PI;
			} else { // doom
			    var pr = 2 - 4 * (0.5 - Math.atan2(1, 1) / Math.PI);
			}
			pr *= srcProjR;
			var px = (rr == 0.0) ? 0.0 : (pr * dx * sr / rr);
			var py = (rr == 0.0) ? 0.0 : (pr * dy * sr / rr);
			var srcX = px + srcWidth * srcProjX;
			var srcY = py + srcHeight * (1 - srcProjY);
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
			 -0.5, -0.5, dstWidth + 1.5, dstHeight + 1.5);
    }
}
