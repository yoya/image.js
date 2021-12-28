"use strict";
/*
 * 2017/03/16- (c) yoya@awm.jp
 */

function clamp(x, min, max) {
    if (min < x) {
	return (x < max)? x : max;
    }
    return min;
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

function drawSrcImage(srcImage, dstCanvas, maxWidthHeight) {
    // console.debug("drawSrcImage");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	var resizeScale = maxWidthHeight / ((width > height)?width:height);
	width  = Math.round(width  * resizeScale);
	height = Math.round(height * resizeScale);
    }
    dstCanvas.width  = width;
    dstCanvas.height = height;
    dstCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
}

function drawSrcImageData(imageData, dstCanvas, maxWidthHeight) {
    // console.debug("drawSrcImage");
    var dstCtx = dstCanvas.getContext("2d");
    var width = imageData.width, height = imageData.height;
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	var resizeScale = maxWidthHeight / ((width > height)?width:height);
	width  = Math.round(width  * resizeScale);
	height = Math.round(height * resizeScale);
        var tmpCanvas = document.createElement("canvas");
        var tmpCtx = tmpCanvas.getContext("2d");
        tmpCanvas.width  = imageData.width;
        tmpCanvas.height = imageData.height;
        tmpCtx.putImageData(imageData, 0, 0);
        dstCanvas.width  = width;
        dstCanvas.height = height;
        dstCtx.drawImage(tmpCanvas,
                         0, 0, tmpCanvas.width, tmpCanvas.height,
		         0, 0, width, height);
    } else {
        dstCanvas.width  = width;
        dstCanvas.height = height;
        dstCtx.putImageData(imageData, 0, 0);
    }
}

function copyCanvas(srcCanvas, dstCanvas) {
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width = width; dstCanvas.height = height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    dstCtx.putImageData(srcImageData, 0, 0);
}

function rescaleCanvas(canvas, scale) {
    const width  = Math.round(canvas.width  * scale);
    const height = Math.round(canvas.height * scale);
    return resizeCanvas(canvacs, width, height);
}

function resizeCanvas(canvas, width, height) {
    var ctx = canvas.getContext("2d");
    var srcImageData = ctx.getImageData(0, 0,  canvas.width, canvas.height);
    canvas.width  = width;
    canvas.height = height;
    var dstImageData = ctx.getImageData(0, 0, width, height);
    copyImageDataScaled(srcImageData, dstImageData);
    ctx.putImageData(dstImageData, 0, 0);
}

function copyCanvasScaled(srcCanvas, dstCanvas) {
    const srcCtx = srcCanvas.getContext("2d");
    const dstCtx = dstCanvas.getContext("2d");
    const srcImageData = srcCtx.getImageData(0, 0, srcCanvas.width,
                                             srcCanvas.height);
    const dstImageData = dstCtx.createImageData(dstCanvas.width,
                                                dstCanvas.height);
    copyImageDataScaled(srcImageData, dstImageData);
    dstCtx.putImageData(dstImageData, 0, 0);
}

function copyImageDataScaled(srcImageData, dstImageData) {
    const srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    const dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    const srcData = srcImageData.data;
    const dstData = dstImageData.data;
    const scaleX = dstWidth  / srcWidth;
    const scaleY = dstHeight / srcHeight;
    // Nearesst Neighbor scaling
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
        for (var dstX = 0; dstX < dstWidth ; dstX++) {
            const srcX = Math.floor(dstX / scaleX);
            const srcY = Math.floor(dstY / scaleY);
            const srcOffset = (srcX + srcY * srcWidth) * 4;
            const dstOffset = (dstX + dstY * dstWidth) * 4;
            dstData[dstOffset] = srcData[srcOffset];
            dstData[dstOffset + 1] = srcData[srcOffset + 1];
            dstData[dstOffset + 2] = srcData[srcOffset + 2];
            dstData[dstOffset + 3] = srcData[srcOffset + 3];
        }
    }
}

function createImageDataFloat32(width, height) {
    return {
	width: width, height:height,
	data:new Float32Array(4 * width * height)
    };
}

function copyImageData(src, dst) {
    var srcStride = 4 * src.width;
    var dstStride = 4 * dst.width;
    var width  = Math.min(src.width, dst.width);
    var width_4 = width * 4;
    var height = Math.min(src.height, dst.height);
    for (var y = 0 ; y < height ; y++) {
	var srxOffset = srcStride * y;
	var dstOffset = dstStride * y;
	for (var x = 0 ; x < width_4 ; x++) {
	    dst.data[dstOffset++] = src.data[srcOffset++];
	}
    }
}

function overlayImageData(src, dst, srcX=0, srcY=0, dstX=0, dstY=0) {
    var srcStride = 4 * src.width;
    var dstStride = 4 * dst.width;
    var width  = Math.min(src.width - srcX, dst.width - dstX);
    var height = Math.min(src.height - srcY, dst.height - dstY);
    var srcOffsetBase = 4 * srcX + srcY * srcStride;
    var dstOffsetBase = 4 * dstX + dstY * dstStride;
    for (var y = 0 ; y < height ; y++) {
	var srcOffset = srcOffsetBase + srcStride * y;
	var dstOffset = dstOffsetBase + dstStride * y;
	for (var x = 0 ; x < width ; x++) {
            var alpha = src.data[srcOffset+3];
            if (alpha == 0) {
                dstOffset+= 4;
                srcOffset+= 4;
            } else if (alpha < 255) {
                var a1 = (255-alpha)/255;
                var a2 = alpha/255;
	        dst.data[dstOffset] = a1*dst.data[dstOffset] + a2*src.data[srcOffset++];
                dstOffset++;
	        dst.data[dstOffset] = a1*dst.data[dstOffset] + a2*src.data[srcOffset++];
                dstOffset++;
	        dst.data[dstOffset] = a1*dst.data[dstOffset] + a2*src.data[srcOffset++];
                dstOffset++;
                dst.data[dstOffset] = a1*dst.data[dstOffset] + a2*src.data[srcOffset++]; // XXX
                dstOffset++;
            } else {
	        dst.data[dstOffset++] = src.data[srcOffset++];
	        dst.data[dstOffset++] = src.data[srcOffset++];
	        dst.data[dstOffset++] = src.data[srcOffset++];
	        dst.data[dstOffset++] = src.data[srcOffset++];
            }
	}
    }
}

function drawGrayImage(srcCanvas, dstCanvas) {
    var srcCtx = srcCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
    dstCanvas.width  = width;
    dstCanvas.height = height;
    var dstCtx = dstCanvas.getContext("2d");
    var dstImageData = dstCtx.createImageData(width, height);
    var gamma = 2.2;
    var gamma_re = 1/2.2; // reciprocal
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
	    var [r, g, b, a] = getRGBA(srcImageData, x, y);
	    var lr = Math.pow(r/255, gamma);
	    var lg = Math.pow(g/255, gamma);
	    var lb = Math.pow(b/255, gamma);
	    var lv = 0.2126  * lr + 0.7152  * lg + 0.0722  * lb;
	    var v = (Math.pow(lv, gamma_re)*255) | 0;
	    var rgba = [v, v, v, a];
	    setRGBA(dstImageData, x, y, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
}

/*
 * out-side fill style
 */
var OUTFILL_TRANSPARENT = 1; // transparent fill
var OUTFILL_EDGE        = 2; // edge extend fill
var OUTFILL_TILE        = 3; // tiled repeat fill
var OUTFILL_MIRROR      = 4; // mirror tiled repeat fill
var OUTFILL_WHITE       = 5; // white fill
var OUTFILL_BLACK       = 6; // black fill

function outfillStyleNumber(name) {
    switch (name) { // out-side fill style
	default:
    case "transparent":
	return OUTFILL_TRANSPARENT;
    case "edge":
	return OUTFILL_EDGE;
    case "tile":
	return OUTFILL_TILE;
    case "mirror":
	return OUTFILL_MIRROR;
    case "white":
	return OUTFILL_WHITE;
    case "black":
	return OUTFILL_BLACK;
    }
    console.warn("unknown outfill style:"+name);
    return OUTFILL_TRANSPARENT;
}

function getRGBA(imageData, x, y, outfill) {
    var width = imageData.width, height = imageData.height;
    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
	switch (outfill) { // out-side fill style
	default:
	case OUTFILL_TRANSPARENT:
	    return [0, 0, 0, 0];
	    break;
	case OUTFILL_EDGE:
	    x = clamp(x, 0, width - 1);
	    y = clamp(y, 0, height - 1);
	    break;
	case OUTFILL_TILE:
	    x %= width;
	    y %= height;
	    break;
	case OUTFILL_MIRROR:
	    if (x < 0) {
		x = -x;
	    }
	    if (y < 0) {
		y = -y;
	    }
	    var xn = (x / width) >> 0;
	    var yn = (y / height) >> 0;
	    x %= width;
	    y %= height;
	    if (xn % 2) {
		x = width - x - 1;
	    }
	    if (yn % 2) {
		y = height - y - 1;
	    }
	    break;
	case OUTFILL_WHITE:
	    return [255, 255, 255, 255];
	    break;
	case OUTFILL_BLACK:
	    return [0, 0, 0, 255];
	    break;
	}
    }
    var offset = 4 * (x + y * width);
    return imageData.data.slice(offset, offset + 4);
}

function setRGBA(imageData, x, y, rgba) {
    var width = imageData.width, height = imageData.height;
    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
	return ; // nothing to do
    }
    imageData.data.set(rgba, 4 * (x + y * width));
}

function addRGBA(imageData, x, y, rgba) {
    var width = imageData.width, height = imageData.height;
    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
	return ; // nothing to do
    }
    var data = imageData.data;
    var offset = 4 * (x + y * imageData.width);
    data[offset++] += rgba[0];
    data[offset++] += rgba[1];
    data[offset++] += rgba[2];
    data[offset++] += rgba[3];
}

function getLuma(imageData, x, y) {
    var rgba = getRGBA(imageData, x, y);
    return lumaFromRGBA(rgba);
}

function alphaOff(imageData) {
    var width = imageData.width, height = imageData.height;
    var data = imageData.data;
    var offset = 0;
    for (var i = 3, n = data.length ; i < n ; i += 4) {
        data[i] = 255;
    }
}


function getColorNum(imageData) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorMap = {};
    for (var i = 0, n = data.length ; i < n ; i += 4) {
	var colorId = RGBA2colorId(data.slice(i, i+4));
	colorMap[colorId] = true;
    }
    return Object.keys(colorMap).length;
}

function RGBA2colorId(rgba) {
    var [r, g, b, a] = rgba;
    var colorId = (((((r * 0x100) + g) * 0x100) + b) * 0x100) + a;
    return colorId;
}
function colorId2RGBA(colorId) {
    var r = (colorId >> 24) & 0xff;
    var g = (colorId >> 16) & 0xff;
    var b = (colorId >> 8) & 0xff;
    var a = (colorId >> 0) & 0xff;
    return [r, g, b, a];
}

function getColorHistogram(imageData) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorHist = {};
    for (var i = 0, n = data.length ; i < n ; i += 4) {
	var colorId = RGBA2colorId(data.slice(i, i+4));
	if (colorId in colorHist) {
	    colorHist[colorId] += 1;
	} else {
	    colorHist[colorId] = 1;
	}
    }
    return colorHist;
}

function getColorHistogramList(imageData, component) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorHist = new Uint32Array(256);
    var offset = {red:0, green:1, blue:2}[component];
    for (var i = 0, n = data.length ; i < n ; i += 4) {
	var v = data[i + offset];
	colorHist[v] += 1;
    }
    return colorHist;
}

function getColorDifferentialHistogramList(imageData, component, diffMax) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorHist = new Uint32Array(256);
    var compOffset = {red:0, green:1, blue:2}[component];
    var diff = new Float32Array(9)
    var _abs = Math.abs;
    for (var y = 0 ; y < (height-2) ; y++) {
        for (var x = 0 ; x < (width-2) ; x++) {
            var offset = 4 * (x + y * width) + compOffset;
            diff[0] = data[offset + 0];
            diff[1] = data[offset + 4];
            diff[2] = data[offset + 8];
            offset += 4 * width;
            diff[3] = data[offset + 0];
            var v   = data[offset + 4]; // center
            diff[5] = data[offset + 8];
            offset += 4 * width;
            diff[6] = data[offset + 0];
            diff[7] = data[offset + 4];
            diff[8] = data[offset + 8];
            if (diffMax) {
	        colorHist[v] += Math.max(
                    _abs(v - diff[0]), _abs(v - diff[1]),
                    _abs(v - diff[2]), _abs(v - diff[3]),
                    _abs(v - diff[5]), _abs(v - diff[6]),
                    _abs(v - diff[7]), _abs(v - diff[8]));
            } else {
	        colorHist[v] +=
                    _abs(v - diff[0]) + _abs(v - diff[1]) +
                    _abs(v - diff[2]) + _abs(v - diff[3]) +
                    _abs(v - diff[5]) + _abs(v - diff[6]) +
                    _abs(v - diff[7]) + _abs(v - diff[8]);
            }
        }
    }
    return colorHist;
}

function getColorLaplacianHistogramList(imageData, component) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorHist = new Uint32Array(256);
    var compOffset = {red:0, green:1, blue:2}[component];
    var diff = new Float32Array(9)
    var _abs = Math.abs;
    for (var y = 0 ; y < (height-2) ; y++) {
        for (var x = 0 ; x < (width-2) ; x++) {
            var offset = 4 * (x + y * width) + compOffset;
            diff[0] = data[offset + 0];
            diff[1] = data[offset + 4];
            diff[2] = data[offset + 8];
            offset += 4 * width;
            diff[3] = data[offset + 0];
            var v   = data[offset + 4]; // center
            diff[5] = data[offset + 8];
            offset += 4 * width;
            diff[6] = data[offset + 0];
            diff[7] = data[offset + 4];
            diff[8] = data[offset + 8];
	    colorHist[v] += _abs(diff[0] + diff[1] + diff[2] + diff[3] +
                                 diff[5] + diff[6] + diff[7] + diff[8] +
                                 - 8 * v);
        }
    }
    return colorHist;
}

function getColorIdDistance_nosqrt(colorId1, colorId2) {
    var [r1, g1, b1, a1] = colorId2RGBA(colorId1);
    var [r2, g2, b2, a2] = colorId2RGBA(colorId2);
    var r_diff = r1 - r2; r_diff *= 3;
    var g_diff = g1 - g2; g_diff *= 5;
    var b_diff = b1 - b2; // b_diff *= 1;
    // var a_diff = a1 - a2;
    return r_diff*r_diff + g_diff*g_diff + b_diff*b_diff; // + a_diff*a_diff;
}

function drawPalette(canvas, palette) {
    var ctx = canvas.getContext("2d");
    var width = canvas.width, height = canvas.height;
    canvas.width = width; canvas.height = height;
    var dx = width  / 0x10;
    var dy = height / 0x10;
    for (var i = 0, n = palette.length ; i < n ; i++) {
	var x = (i % 0x10) * dx;
	var y = Math.floor(i / 0x10) * dy;
	var [r,g,b,a] = colorId2RGBA(palette[i]);
	ctx.fillStyle = "rgb("+r+","+g+","+b+")";
	ctx.fillRect(x, y, dx-1, dy-1);
	ctx.fill();
    }
}

function xyArr2CntlArr(xyArr) {
    var n = xyArr.length;
    var arr  = xyArr.slice(-2).concat(xyArr).concat([xyArr[0]]);
    var cntlArr = [];
    for (var i = 0 ;  i < n ; i++) {
	var [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = arr.slice(i, i+4);
	var cx1 = x2 + (x2 - x1)/4;
	var cy1 = y2 + (y2 - y1)/4;
	var cx2 = x3 + (x3 - x4)/4;
	var cy2 = y3 + (y3 - y4)/4;
	cntlArr.push([(cx1 + cx2)/2, (cy1 + cy2)/2]);
    }
    return cntlArr;
}

function drawHistgramGraph(histCanvas, redHist, greenHist, blueHist,
			   minValue, maxValue, totalLine, histogram) {
    var height = histCanvas.height;
    histCanvas.style.backgroundColor = "black";
    histCanvas.height = height; // canvas clear
    var ctx = histCanvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, histCanvas.width, histCanvas.height);
    ctx.globalCompositeOperation = "lighter";
    var redCount = redHist.reduce( function(prev, cur) { return prev + cur; });
    var greenCount = redHist.reduce( function(prev, cur) { return prev + cur; });
    var blueCount = redHist.reduce( function(prev, cur) { return prev + cur; });
    var processList = [["#F00", "#855", redHist,   redCount],
		       ["#0F0", "#585", greenHist, greenCount],
		       ["#00F", "#558", blueHist,  blueCount]];
    var max = 0;
    for (var i = 0; i < processList.length ; i++) {
	var [color, color2, hist]  =  processList[i];
	for (var j = 0 ; j < 256 ; j++) {
	    var v = hist[j];
	    if (max < v) {
		max = v;
	    }
	}
    }
    for (var i = 0; i < processList.length ; i++) {
	var [color, color2, hist, nColor]  =  processList[i];
	ctx.strokeStyle=color2;
	// total line
	if (totalLine) {
	    ctx.beginPath();
	    ctx.moveTo(0+0.5, height);
	    var total = 0;
	    for (var x = 0 ; x < 256 ; x++) {
		total += hist[x];
		var y = height  - height * total / nColor;
		//. console.log(hist[x], total, y);
		ctx.lineTo(x+0.5, y+0.5);
	    }
	    ctx.stroke();
	}
	
	ctx.strokeStyle=color;
	// histogram bar
        if (histogram) {
	    for (var x = 0 ; x < 256 ; x++) {
	        var nColor = hist[x];
	        var y = height - (nColor * height/max) - 1;
	        ctx.beginPath();
	        ctx.moveTo(x+0.5, height);
	        ctx.lineTo(x+0.5, y+0.5);
	        ctx.stroke();
	    }
        }
    }

    // out of range
    ctx.fillStyle="gray";
    if (0 < minValue) {
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.rect(0, 0, minValue, height);
	ctx.fill();
    }
    if (maxValue < 255) {
 	ctx.beginPath();
	ctx.moveTo(maxValue+1, 0);
	ctx.rect(maxValue+1, 0, 256, height);
	ctx.fill();
    }
}
