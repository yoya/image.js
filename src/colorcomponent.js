'use strict';
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas1 = document.getElementById('dstCanvas1');
    const dstCanvas2 = document.getElementById('dstCanvas2');
    const dstCanvas3 = document.getElementById('dstCanvas3');
    const dstCanvas4 = document.getElementById('dstCanvas4');
    const dstCanvasArr = [dstCanvas1, dstCanvas2, dstCanvas3, dstCanvas4];
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    let component = document.getElementById('componentSelect').value;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    //
    bindFunction({ 'maxWidthHeightRange':'maxWidthHeightText' },
		 function() {
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 });
    bindFunction({ 'componentSelect':null },
		 function() {
		     component = document.getElementById('componentSelect').value;
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 });
    //
}

function drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorComponent(srcCanvas, dstCanvasArr, component);
}

function colorComponent(imageData, x, y, component) {
    const rgba = getRGBA(imageData, x, y);
    var [r, g, b, a] = rgba;
    let rgbaArr;
    switch (component) {
    case 'rgb':
	var rgba1 = [r, 0, 0, a];
	var rgba2 = [0, g, 0, a];
	var rgba3 = [0, 0, b, a];
	rgbaArr = [rgba1, rgba2, rgba3];
	break;
    case 'cmyk': // naive convert
	var [c, m, y, k] = RGB2CMYK(rgba);
	var rgb1 = CMYK2RGB([c, 0, 0, 0]);
	var rgb2 = CMYK2RGB([0, m, 0, 0]);
	var rgb3 = CMYK2RGB([0, 0, y, 0]);
	var rgb4 = CMYK2RGB([0, 0, 0, k]);
	rgbaArr = [rgb1, rgb2, rgb3, rgb4].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'cmy': // naive convert
	var [c, m, y] = RGB2CMY(rgba);
	var rgb1 = CMYK2RGB([c, 0, 0, 0]);
	var rgb2 = CMYK2RGB([0, m, 0, 0]);
	var rgb3 = CMYK2RGB([0, 0, y, 0]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'ycbcr': // YCbCr (JPEG)
	var [yy, cb, cr] = RGB2YCbCr(rgba);
	var rgb1 = YCbCr2RGB([yy, 128, 128]);
	var rgb2 = YCbCr2RGB([128, cb, 128]);
	var rgb3 = YCbCr2RGB([128, 128, cr]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'yiq': // YIQ (NTSC)
	var [yy, ii, qq] = RGB2YIQ(rgba);
	var rgb1 = YIQ2RGB([yy, 128, 128]);
	var rgb2 = YIQ2RGB([128, ii, 128]);
	var rgb3 = YIQ2RGB([128, 128, qq]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'yuv_bt601': // YUV (BT.601))
	var [yy, uu, vv] = RGB2YUV_BT601(rgba);
	var rgb1 = YUV2RGB_BT601([yy, 128, 128]);
	var rgb2 = YUV2RGB_BT601([128, uu, 128]);
	var rgb3 = YUV2RGB_BT601([128, 128, vv]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'yuv_bt709': // YUV (BT.709)
	var [yy, uu, vv] = RGB2YUV_BT709(rgba);
	var rgb1 = YUV2RGB_BT709([yy, 128, 128]);
	var rgb2 = YUV2RGB_BT709([128, uu, 128]);
	var rgb3 = YUV2RGB_BT709([128, 128, vv]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'ydbdr': // YDbDr (SECOM)
	var [yy, db, dr] = RGB2YDbDr(rgba);
	var rgb1 = YDbDr2RGB([yy, 128, 128]);
	var rgb2 = YDbDr2RGB([128, db, 128]);
	var rgb3 = YDbDr2RGB([128, 128, dr]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'hsv':
	var [h, s, v] = RGB2HSV(rgba);
	if (s < Number.MIN_VALUE) {
	    var rgb1 = [127, 127, 127];
	} else {
	    var rgb1 = HSV2RGB([h, 1, 1, 0]);
	}
	var rgb2 = HSV2RGB([0, s, s / 2 + 0.5, 0]);
	var rgb3 = HSV2RGB([0, 0, v, 0]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'hsl':
	var [h, s, l] = RGB2HSL(rgba);
	if (s < Number.MIN_VALUE) {
	    var rgb1 = [127, 127, 127];
	} else {
	    var rgb1 = HSL2RGB([h, 1, 0.5, 0]);
	}
	var rgb2 = HSL2RGB([0, s, 0.5, 0]);
	var rgb3 = HSL2RGB([0, 0, l, 0]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    arr.push(a); return arr;
	});
	break;
    case 'xyb': // Xyb
	var [x, y, b] = RGB2Xyb(rgba);
	var rgb1 = Xyb2RGB([x, 0, 0]);
	var rgb2 = Xyb2RGB([0, y, 0]); rgb2[0] *= 0.5; rgb2[1] *= 0.5;
	var rgb3 = Xyb2RGB([0, 0, b]);
	rgbaArr = [rgb1, rgb2, rgb3].map(function(arr) {
	    const max = Math.max.apply(null, arr);
	    arr.push(a); return arr;
	});
	break;
    default:
	console.error('Illegal component:' + component);
    }
    return rgbaArr;
}

function drawColorComponent(srcCanvas, dstCanvasArr, component) {
    // console.debug("drawColorTransform");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext('2d');
    });
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    const dstWidth  = srcWidth;
    const dstHeight = srcHeight;
    dstCanvasArr.forEach(function(c) {
	c.width  = dstWidth; c.height = dstHeight;
    });

    //
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(dstWidth, dstHeight);
    });
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    const srcX = dstX; const srcY = dstY;
	    const rgbaArr = colorComponent(srcImageData, srcX, srcY, component);
	    for (var i = 0, n = rgbaArr.length; i < n; i++) {
		setRGBA(dstImageDataArr[i], dstX, dstY, rgbaArr[i]);
	    }
	}
    }
    for (var i = 0, n = dstImageDataArr.length; i < n; i++) {
	dstCtxArr[i].putImageData(dstImageDataArr[i], 0, 0);
    }
}
