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

function drawSrcImage(srcImage, dstCanvas, maxWidthHeight) {
    // console.debug("drawSrcImage");
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcImage.width, height = srcImage.height;
    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
	var resizeScale = maxWidthHeight / ((width > height)?width:height);
	width  *= resizeScale;
	height *= resizeScale;
    }
    dstCanvas.width  = width;
    dstCanvas.height = height;
    dstCtx.drawImage(srcImage, 0, 0, srcImage.width, srcImage.height,
		     0, 0, width, height);
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
    return resizeCanvas(canvacs,
                        Math.round(canvas.width  * scale),
                        Math.round(canvas.height * scale));
}

function resizeCanvas(canvas, width, height) {
    var ctx = canvas.getContext("2d");
    var srcWidth = canvas.width, srcHeight = canvas.height;
    var dstWidth  = width;
    var dstHeight = height;
    var scaleX = dstWidth  / srcWidth;
    var scaleY = dstHeight / srcHeight;
    var srcImageData = ctx.getImageData(0, 0, srcWidth, srcHeight);
    canvas.width  = dstWidth;
    canvas.height = dstHeight;
    var dstImageData = ctx.getImageData(0, 0, dstWidth, dstHeight);
    // Nearesst Neighbor scaling
    for (var dstY = 0 ; dstY < dstHeight ; dstY++) {
        for (var dstX = 0; dstX < dstWidth ; dstX++) {
            var srcX = Math.round(dstX / scaleX);
            var srcY = Math.round(dstY / scaleY);
            var rgba = getRGBA(srcImageData, srcX, srcY);
            setRGBA(dstImageData, dstX, dstY, rgba);
        }
    }
    ctx.putImageData(dstImageData, 0, 0);
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
    var dstCtx = dstCanvas.getContext("2d");
    var width = srcCanvas.width, height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    //
    var srcImageData = srcCtx.getImageData(0, 0, width, height);
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
    var data = imageData.data;
    var offset = 4 * (x + y * imageData.width);
    data[offset++] = rgba[0];
    data[offset++] = rgba[1];
    data[offset++] = rgba[2];
    data[offset++] = rgba[3];
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

function getColorDifferentialHistogramList(imageData, component) {
    var width = imageData.width, height = imageData.height;
    if ("getContext" in imageData) { // canvas fallback
	var ctx = imageData.getContext("2d");
	imageData = ctx.getImageData(0, 0, width, height);
    }
    var data = imageData.data;
    var colorHist = new Uint32Array(256);
    var compOffset = {red:0, green:1, blue:2}[component];
    for (var y = 0 ; y < height ; y++) {
        for (var x = 0 ; x < width ; x++) {
            var v = 0;
            var diff_max = 0;
            var width2 = ((x+1) < width)?(x+1):(width-1);
            var height2 = ((y+1) < height)?(y+1):(height-1);
            for (var yy = (y<=0)?1:y-1 ; yy < height2 ; yy++) {
                for (var xx = (x<=0)?1:x-1 ; xx < width2 ; xx++) {
                    var offset = 4 * (xx + yy * width);
                    var vv = data[offset + compOffset];
                    if ((x === xx) && (y === yy)) {
                        v = vv;
                    } else {
                        var diff = (v>vv)?(v-vv):(vv-v);
                        if (diff_max < diff) {
                            diff_max = diff;
                        }
                    }
                }
            }
	    colorHist[v] += diff_max;
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
    for (var y = 1 ; y < (height-1) ; y++) {
        for (var x = 1 ; x < (width-1) ; x++) {
            var diff = 0;
            var offset = 4 * (x + y * width);
            diff += data[offset + 0 + compOffset];
            diff += data[offset + 4 + compOffset];
            diff += data[offset + 8 + compOffset];
            offset += 4 * width;
            diff += data[offset + 0 + compOffset];
            var v = data[offset + 4 + compOffset];
            diff += data[offset + 8 + compOffset];
            offset += 4 * width;
            diff += data[offset + 0 + compOffset];
            diff += data[offset + 4 + compOffset];
            diff += data[offset + 8 + compOffset];
	    colorHist[v] += Math.abs(diff - v*8);
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
