"use strict";
/*
 * 2017/04/17- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var srcCanvas = document.getElementById("srcCanvas");
    var dstCanvasArr = ["dstCanvas1", "dstCanvas2", "dstCanvas3", "dstCanvas4", "dstCanvas"].map(function(id) { return document.getElementById(id); });
    var srcImage = new Image(srcCanvas.width, srcCanvas.height);
    //
    var component = document.getElementById("componentSelect").value;
    //
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
	}
	srcImage.src = dataURL;
    }, "DataURL");
    //
    bindFunction({"maxWidthHeightRange":"maxWidthHeightText"},
		 function() {
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 } );
    bindFunction({"componentSelect":null,
                  "amp1Range":"amp1Text", "amp2Range":"amp2Text",
                  "amp3Range":"amp3Text", "amp4Range":"amp4Text"},
		 function() {
		     component = document.getElementById("componentSelect").value;
		     drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component);
		 } );
}

function drawSrcImageAndColorComponent(srcImage, srcCanvas, dstCanvasArr, component) {
    var maxWidthHeight = parseFloat(document.getElementById("maxWidthHeightRange").value);
    var ampIdArr = ["amp1Range", "amp2Range", "amp3Range", "amp4Range"];
    var ampArr = ampIdArr.map(function(id) { return parseFloat(document.getElementById(id).value); });
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawColorComponent(srcCanvas, dstCanvasArr, component, ampArr);
}
    
function colorComponent(imageData, x, y, component, ampArr) {
    var rgba = getRGBA(imageData, x, y);
    var [r, g, b, a] = rgba;
    var rgbaArr;
    var rgb1, rgb2, rgb3, rgb4 = null, rgb5;
    switch (component) {
    case "rgb":
        r *= ampArr[0];
        g *= ampArr[1];
        b *= ampArr[2];
	rgb1 = [r, 0, 0];
	rgb2 = [0, g, 0];
	rgb3 = [0, 0, b];
	rgb5 = [r, g, b];
	break;
    case "rgba":
        r *= ampArr[0];
        g *= ampArr[1];
        b *= ampArr[2];
        a *= ampArr[3];
	rgb1 = [r, 0, 0, 255];
	rgb2 = [0, g, 0, 255];
	rgb3 = [0, 0, b, 255];
	rgb4 = [a, a, a, 255];
	rgb5 = [r, g, b, a];
	break;
    case "cmyk": // naive convert
	var [c, m, y, k] = RGB2CMYK(rgba);
        c *= ampArr[0];
        m *= ampArr[1];
        y *= ampArr[2];
        k *= ampArr[3];
	rgb1 = CMYK2RGB([c, 0, 0, 0]);
	rgb2 = CMYK2RGB([0, m, 0, 0]);
	rgb3 = CMYK2RGB([0, 0, y, 0]);
	rgb4 = CMYK2RGB([0, 0, 0, k]);
	rgb5 = CMYK2RGB([c, m, y, k]);
	break;
    case "cmy": // naive convert
	var [c, m, y] = RGB2CMY(rgba);
        c *= ampArr[0];
        m *= ampArr[1];
        y *= ampArr[2];
	rgb1 = CMYK2RGB([c, 0, 0, 0]);
	rgb2 = CMYK2RGB([0, m, 0, 0]);
	rgb3 = CMYK2RGB([0, 0, y, 0]);
	rgb5 = CMYK2RGB([c, m, y, 0]);
	break;
    case "ycbcr": // YCbCr (JPEG)
	var [yy, cb, cr] = RGB2YCbCr(rgba);
        yy *= ampArr[0];
        cb *= ampArr[1];
        cr *= ampArr[2];
	rgb1 = YCbCr2RGB([yy, 128, 128]);
	rgb2 = YCbCr2RGB([128, cb, 128]);
	rgb3 = YCbCr2RGB([128, 128, cr]);
	rgb5 = YCbCr2RGB([yy, cb, cr]);
	break;
    case "yiq": // YIQ (NTSC)
	var [yy, ii, qq] = RGB2YIQ(rgba);
        yy *= ampArr[0];
        ii*= ampArr[1];
        qq *= ampArr[2];
	rgb1 = YIQ2RGB([yy, 128, 128]);
	rgb2 = YIQ2RGB([128, ii, 128]);
	rgb3 = YIQ2RGB([128, 128, qq]);
	rgb5 = YIQ2RGB([yy, ii, qq]);
	break;
    case "yuv_bt601": // YUV (BT.601))
	var [yy, uu, vv] = RGB2YUV_BT601(rgba);
        yy *= ampArr[0];
        uu *= ampArr[1];
        vv *= ampArr[2];
	rgb1 = YUV2RGB_BT601([yy, 128, 128]);
	rgb2 = YUV2RGB_BT601([128, uu, 128]);
	rgb3 = YUV2RGB_BT601([128, 128, vv]);
	rgb5 = YUV2RGB_BT601([yy, uu, vv]);
	break;
    case "yuv_bt709": // YUV (BT.709)
	var [yy, uu, vv] = RGB2YUV_BT709(rgba);
        yy *= ampArr[0];
        uu *= ampArr[1];
        vv *= ampArr[2];
	rgb1 = YUV2RGB_BT709([yy, 128, 128]);
	rgb2 = YUV2RGB_BT709([128, uu, 128]);
	rgb3 = YUV2RGB_BT709([128, 128, vv]);
	rgb5 = YUV2RGB_BT709([yy, uu, vv]);
	break;
    case "ydbdr": // YDbDr (SECOM)
	var [yy, db, dr] = RGB2YDbDr(rgba);
        yy *= ampArr[0];
        db *= ampArr[1];
        dr *= ampArr[2];
	rgb1 = YDbDr2RGB([yy, 128, 128]);
	rgb2 = YDbDr2RGB([128, db, 128]);
	rgb3 = YDbDr2RGB([128, 128, dr]);
	rgb5 = YDbDr2RGB([yy, db, dr]);
	break;
    case "hsv":
	var [h, s, v] = RGB2HSV(rgba);
        h *= ampArr[0];
        s *= ampArr[1];
        v *= ampArr[2];
	if (s < Number.MIN_VALUE) {
	    rgb1 = [127, 127, 127];
	} else {
	    rgb1 = HSV2RGB([h, 1, 1, 0]);
	}
	rgb2 = HSV2RGB([0, s, s/2+0.5, 0]);
	rgb3 = HSV2RGB([0, 0, v, 0]);
	rgb5 = HSV2RGB([h, s, v]);
	break;
    case "hsl":
	var [h, s, l] = RGB2HSL(rgba);
        h *= ampArr[0];
        s *= ampArr[1];
        l *= ampArr[2];
	if (s < Number.MIN_VALUE) {
	    rgb1 = [127, 127, 127];
	} else {
	    rgb1 = HSL2RGB([h, 1, 0.5, 0]);
	}
	rgb2 = HSL2RGB([0, s, 0.5, 0]);
	rgb3 = HSL2RGB([0, 0, l, 0]);
	rgb5 = HSL2RGB([h, s, l]);
	break;
    case "xyb": // Xyb (naive convertion, not Butteraugli)
	var [x, y, b] = RGB2Xyb(rgba);
        x *= ampArr[0];
        y *= ampArr[1];
        b *= ampArr[2];
	rgb1 = Xyb2RGB([x, 128, 0]);
	rgb2 = Xyb2RGB([128, y, 0]);
	rgb3 = Xyb2RGB([128, 0, b]);
	rgb5 = Xyb2RGB([x, y, b]);
	break;
    default:
	console.error("Illegal component:"+component);
    }
    rgbaArr = [rgb1, rgb2, rgb3, rgb4, rgb5].map(function(arr) {
	if (arr === null) { return null; }
        if ((arr.length === 3) || (arr.length === 4)) {
            if (arr.length === 3) {
                if (arr.push) {  // array
                    arr.push(a);
                } else {         // typed array
                    let tmp = new (arr.constructor)(4);
                    tmp.set(arr);  tmp[3] = a;
                    arr = tmp;
                }
            }
            return arr;
	}
        console.error("arr.length:"+arr.length+" !== 3, 4")
    });
    return rgbaArr;
}

function drawColorComponent(srcCanvas, dstCanvasArr, component, ampArr) {
    // console.debug("drawColorTransform");
    var srcCtx = srcCanvas.getContext("2d");
    var dstCtxArr = dstCanvasArr.map(function(c) {
	return c.getContext("2d");
    });
    var srcWidth = srcCanvas.width, srcHeight = srcCanvas.height;
    var dstWidth  = srcWidth;
    var dstHeight = srcHeight;
    dstCanvasArr.forEach(function(c) {
	c.width  = dstWidth; c.height = dstHeight;
    });

    //
    var srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    var dstImageDataArr = dstCtxArr.map(function(c) {
	return c.createImageData(dstWidth, dstHeight);
    });
    for (var dstY = 0 ; dstY < dstHeight; dstY++) {
        for (var dstX = 0 ; dstX < dstWidth; dstX++) {
	    var srcX = dstX, srcY = dstY;
	    var rgbaArr = colorComponent(srcImageData, srcX, srcY, component, ampArr);
	    for (var i = 0, n = rgbaArr.length ; i < n ; i++) {
                if (rgbaArr[i] !== null) {
		    setRGBA(dstImageDataArr[i], dstX, dstY, rgbaArr[i]);
                }
	    }
	}
    }
    for (var i = 0, n = dstImageDataArr.length ; i < n ; i++) {
	dstCtxArr[i].putImageData(dstImageDataArr[i], 0, 0);
    }
}
