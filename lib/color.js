"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

/*
 * xy <=> XYZ
 */
function xy2XYZ(xy) {
    var [x, y] = xy;
    var ly = y;
    var lx = (x / y) * ly
    var lz = (1 - x - y) / y * ly;
    return [lx, ly, lz];
}

function XYZ2xy(lxyz) {
    var [lx, ly, lz] = lxyz;
    var x = lx / (lx + ly + lz);
    var y = ly / (lx + ly + lz);
    return [x, y];
}

/*
 * XYZ <=> RGB
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html
 */
function XYZ2RGB(lxyz) { // to linear RGB
    var [lx, ly, lz] = lxyz;
    // linear sRGB
    var r =  3.2410 * lx - 1.5374 * ly - 0.4986 * lz;
    var g = -0.9692 * lx + 1.8760 * ly + 0.0416 * lz;
    var b =  0.0556 * lx - 0.2040 * ly + 1.0570 * lz;
    return [r, g, b];
}

function RGB2XYZ(lrgb) { // from linear RGB
    var [lr, lg, lb] = lrgb;
    // linear sRGB
    var lx = 0.4124 * lr + 0.3576 * lg + 0.1805 * lb;
    var ly = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    var lz = 0.0193 * lr + 0.1192 * lg + 0.9505 * lb;
    return [lx, ly, lz];
}

/*
 * linear RGB <=> sRGB
 * http://en.wikipedia.org/wiki/SRGB
 */
function linearRGB2sRGB(lrgb) {
    var rgb = [];
    for (var lv of lrgb) {
	if (lv < 0.0031308) {
	    var v = 12.92 * lv;
	} else {
	    var v = 1.055 * Math.pow(lv, 1/2.4) - 0.055;
	}
	v *= 255;
	if (v < 0) {
	    v = 0;
	} else if (255 < v) {
	    v = 255;
	}
	rgb.push(v >>> 0);
    }
    return rgb;
}

function sRGB2linearRGB(rgb) {
    var lrgb = [];
    for (var v of rgb) {
	v /= 255;
	if (v <= 0.04045) {
	    var lv = v / 12.92;
	} else {
	    var lv = Math.pow((v + 0.055) / 1.055, 2.4) ;
	}
	lrgb.push(lv);
    }
    return lrgb;
}

/*
 * XYZ <=> sRGB
 */
function XYZ2sRGB(lxyz) {
    // to linear sRGB
    var rgb = XYZ2RGB(lxyz);
    // gamma correction
    return linearRGB2sRGB(rgb);
}

function sRGB2XYZ(rgb) {
    // gamma correction
    var lrgb = sRGB2linearRGB(rgb);
    // from linear sRGB
    return RGB2XYZ(lrgb);
}

/*
 * xy <=> u'v'
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ2uv.html
 */
function xy2uava(xy) {
    var [x, y] = xy;
    var ua = 4 * x / ( -2*x + 12*y + 3);
    var va = 9 * y / ( -2*x + 12*y + 3);
    return [ua, va];
}

function uava2xy(uava) {
    var [ua, va] = uava;
    var x = 9 * ua / (6*ua - 16*va + 12);
    var y = 4 * va / (6*ua - 16*va + 12);
    return [x, y];
}

/*
 * RGB <= CMYK naive convert
 */
function RGB2CMYK(rgb) {
    var [r, g, b] = rgb;
    var k = 255 - Math.max(r, g, b);
    if (k == 255) {
        var [c, m, y] = [0, 0, 0];
    } else {
        var c = 255 * ( 255 - r - k) / (255 - k)
	var m = 255 * ( 255 - g - k) / (255 - k)
        var y = 255 * ( 255 - b - k) / (255 - k)
    }
    return [c >>> 0, m >>> 0, y >>> 0, k >>> 0];
}

function CMYK2RGB(cmyk) {
    var [c, m, y, k] = cmyk;
    var r = 255 - Math.min(255, c * (255 - k)/255 + k)
    var g = 255 - Math.min(255, m * (255 - k)/255 + k)
    var b = 255 - Math.min(255, y * (255 - k)/255 + k)
    return [r >>> 0, g >>> 0, b >>> 0];
}

/*
 * RGB <=> YCbCr (JPEG)
 */
function RGB2YCbCr(rgb) {
    var [r, g, b] = rgb;
    var yy =  0.299  * r + 0.587  * g + 0.114  * b;
    var cb = -0.1687 * r - 0.3313 * g + 0.5    * b + 128;
    var cr =  0.5    * r - 0.4187 * g - 0.0813 * b + 128;
    return [yy >>> 0, cb >>> 0, cr >>> 0];
}

function YCbCr2RGB(ycbcr) {
    var y = ycbcr[0], cb = ycbcr[1], cr = ycbcr[2];
    var r = y                        + 1.402   * (cr - 128);
    var g = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128);
    var b = y + 1.772   * (cb - 128);
    return [r >>> 0, g >>> 0, b >>> 0];
}

/*
  YIQ (0-255) <=> RGB
  https://en.wikipedia.org/wiki/YIQ
*/
function RGB2YIQ(rgb) {
    var [r, g, b] = rgb;
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    var i = 0.596 * r - 0.274 * g - 0.322 * b + 128;
    var q = 0.211 * r - 0.523 * g + 0.312 * b + 128;
    return [y >>> 0, i >>> 0, q >>> 0];
}

function YIQ2RGB(yiq) {
    var [y, i, q] = yiq;
    var r = y + 0.956 * (i - 128) + 0.621 * (q - 128);
    var g = y - 0.272 * (i - 128) - 0.647 * (q - 128);
    var b = y - 1.106 * (i - 128) + 1.703 * (q - 128);
    return [r >>> 0, g >>> 0, b >>> 0];
}

/*
  YUV (PAL - SDTV BT.601) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT601(rgb) {
    var [r, g, b] = rgb;
    var y =   0.299   * r + 0.587   * g + 0.114   * b;
    var u = - 0.14713 * r - 0.28886 * g + 0.436   * b + 128;
    var v =   0.615   * r - 0.51499 * g - 0.10001 * b + 128;
    return [y >>> 0, u >>> 0, v >>> 0];
}
function YUV2RGB_BT601(yuv) {
    var [y, u, v] = yuv;
    var r = y                       + 1.13983 * (v - 128);
    var g = y - 0.39465 * (u - 128) - 0.58060 * (v - 128);
    var b = y + 2.03211 * (u - 128) ;
    return [r >>> 0, g >>> 0, b >>> 0];
}

/*
  YUV (PAL - HDTV - BT.709) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT709(rgb) {
    var [r, g, b] = rgb;
    var y =   0.2126  * r + 0.7152  * g + 0.0722  * b;
    var u = - 0.09991 * r - 0.33609 * g + 0.436   * b + 128;
    var v =   0.615   * r - 0.55861 * g - 0.05639 * b + 128;
    return [y >>> 0, u >>> 0, v >>> 0];
}
function YUV2RGB_BT709(yuv) {
    var [y, u, v] = yuv;
    var r = y                       + 1.28033 * (v - 128);
    var g = y - 0.21482 * (u - 128) - 0.38059 * (v - 128);
    var b = y + 2.12798 * (u - 128) ;
    return [r >>> 0, g >>> 0, b >>> 0];
}
