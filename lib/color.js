"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

function lumaFromRGBA(rgba) {
    var [r,g,b,a] = rgba;
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y * a / 255;
    // return y;
}

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
// exports.linearRGB2sRGB = linearRGB2sRGB;
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
	rgb.push(v >> 0);
    }
    return rgb;
}

// exports.sRGB2linearRGB = sRGB2linearRGB;
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
 * xy <=> uv
 * https://en.wikipedia.org/wiki/CIELUV
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ2uv.html
 */
function xy2uv(xy) {
    var [x, y] = xy;
    var u = 4 * x / ( -2*x + 12*y + 3);
    var v = 6 * y / ( -2*x + 12*y + 3);
    return [u, v];
}

function uv2xy(uv) {
    var [u, v] = uv;
    var x = 3 * u / (2*u - 8*v + 4);
    var y = 2 * v / (2*u - 8*v + 4);
    return [x, y];
}

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

function xy2uv_judd(xy) {
    var [x, y] = xy;
    var u = (5.5932*x + 1.9116*y) / (-1.882*x + 12*y + 2.9088)
    var v = 7.8972*y / (-1.882*x + 12*y + 2.9088)
    return [u, v];
}
function uv2xy_judd(uv) {
    var [u, v] = uv;
    var x = (2.8714*u - 0.6951*v) / (1.8578*u - 8.8395*v + 5.5213)
    var y = 2.0337*v / (1.8578*u - 8.8395*v + 5.5213)
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
    return [c >> 0, m >> 0, y >> 0, k >> 0];
}

function CMYK2RGB(cmyk) {
    var [c, m, y, k] = cmyk;
    var r = 255 - Math.min(255, c * (255 - k)/255 + k)
    var g = 255 - Math.min(255, m * (255 - k)/255 + k)
    var b = 255 - Math.min(255, y * (255 - k)/255 + k)
    return [r >> 0, g >> 0, b >> 0];
}

function RGB2CMY(rgb) {
    var [r, g, b] = rgb;
    var c = 255 - r;
    var m = 255 - g;
    var y = 255 - b;
    return [c >> 0, m >> 0, y >> 0];
}

/*
 * RGB <=> YCbCr (JPEG)
 */
function RGB2YCbCr(rgb) {
    var [r, g, b] = rgb;
    var yy =  0.299  * r + 0.587  * g + 0.114  * b;
    var cb = -0.1687 * r - 0.3313 * g + 0.5    * b;
    var cr =  0.5    * r - 0.4187 * g - 0.0813 * b;
    cb = cb + 128;
    cr = cr + 128;
    return [yy >> 0, cb >> 0, cr >> 0];
}

function YCbCr2RGB(ycbcr) {
    var [y, cb, cr] = ycbcr;
    cb = cb - 128;
    cr = cr - 128;
    var r = y                + 1.402   * cr;
    var g = y - 0.34414 * cb - 0.71414 * cr;
    var b = y + 1.772   * cb               ;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YIQ (0-255) <=> RGB
  https://en.wikipedia.org/wiki/YIQ
*/
function RGB2YIQ(rgb) {
    var [r, g, b] = rgb;
    var y = 0.299 * r + 0.587 * g + 0.114 * b;
    var i = 0.596 * r - 0.274 * g - 0.322 * b;  b - y
    var q = 0.211 * r - 0.523 * g + 0.312 * b;  r - y
    i = i + 128;
    q = q + 128;
    return [y >> 0, i >> 0, q >> 0];
}

function YIQ2RGB(yiq) {
    var [y, i, q] = yiq;
    i = i - 128;
    q = q - 128;
    var r = y + 0.956 * i + 0.621 * q;
    var g = y - 0.272 * i - 0.647 * q;
    var b = y - 1.106 * i + 1.703 * q;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YUV (PAL - SDTV BT.601) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT601(rgb) {
    var [r, g, b] = rgb;
    var y =   0.299   * r + 0.587   * g + 0.114   * b;
    var u = - 0.14713 * r - 0.28886 * g + 0.436   * b;
    var v =   0.615   * r - 0.51499 * g - 0.10001 * b;
    u = u + 128;
    v = v + 128;
    return [y >> 0, u >> 0, v >> 0];
}
function YUV2RGB_BT601(yuv) {
    var [y, u, v] = yuv;
    u = u - 128;
    v = v - 128;
    var r = y               + 1.13983 * v;
    var g = y - 0.39465 * u - 0.58060 * v;
    var b = y + 2.03211 * u              ;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YUV (PAL - HDTV - BT.709) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT709(rgb) {
    var [r, g, b] = rgb;
    var y =   0.2126  * r + 0.7152  * g + 0.0722  * b;
    var u = - 0.09991 * r - 0.33609 * g + 0.436   * b;
    var v =   0.615   * r - 0.55861 * g - 0.05639 * b;
    u = u + 128;
    v = v + 128;
    return [y >> 0, u >> 0, v >> 0];
}
function YUV2RGB_BT709(yuv) {
    var [y, u, v] = yuv;
    u = u - 128;
    v = v - 128;
    var r = y               + 1.28033 * v;
    var g = y - 0.21482 * u - 0.38059 * v;
    var b = y + 2.12798 * u              ;
    return [r >> 0, g >> 0, b >> 0];
}

/*
 * RGB <=> YDbDr (SECOM)
 http://mntone.hateblo.jp/entry/2017/04/01/023417
 */
function RGB2YDbDr(rgb) {
    var [r, g, b] = rgb;
    var yy =  0.299 * r + 0.587 * g + 0.114 * b;
    var db = -0.450 * r - 0.883 * g + 1.333 * b;
    var dr = -1.333 * r + 1.116 * g + 0.217 * b;
    db = db / 2.666 + 128;
    dr = dr / 2.666 + 128;
    return [yy >> 0, db >> 0, dr >> 0];
}

/*
  http://mntone.hateblo.jp/entry/2017/04/01/023417
*/

function YDbDr2RGB(ydbdr) {
    var y = ydbdr[0], db = ydbdr[1], dr = ydbdr[2];
    db = (db - 128) * 2.666;
    dr = (dr - 128) * 2.666;
    var r = y + 0.000092303716148 * db - 0.525912630661865 * dr;
    var g = y - 0.129132898890509 * db + 0.267899328207599 * dr;
    var b = y + 0.664679059978955 * db - 0.000079202543533 * dr;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  HSV(360.0, 1.0, 1.0) <~> RGB
  https://en.wikipedia.org/wiki/HSL_and_HSV
*/
function RGB2HSV(rgb) {
    var [r, g, b] = rgb;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var max_min = max - min;
    var v = max / 255;
    var s = (max_min) / max;
    if ((r > g) && (r > b)) { // R max
	var h = (g - b) / (max_min);
	if (h < 0) { h += 6; }
    } else if (g > b){ // G max
	var h = (b - r) / (max_min) + 2;
    } else if (b > g){ // B max
	var h = (r - g) / (max_min) + 4;
    } else {
	var h = 0;
    }
    h = h * 60;
    return [h, s, v];
}
// http://hooktail.org/computer/index.php?RGB%A4%AB%A4%E9HSV%A4%D8%A4%CE%CA%D1%B4%B9%A4%C8%C9%FC%B8%B5
function HSV2RGB(hsv) {
    var [h, s, v] = hsv;
    h = (h<0)? (h + 360): (h%360); // don't care for 2-loop negative.
    var h2 = (h / 60) >> 0;
    var f = h/60 - h2;
    var m = v * (1 - s);
    var n = v * (1 - s * f);
    var k = v * (1 - s * (1 - f));
    switch (h2) {
    case 0:
	var [r, g, b] = [v, k, m];
	break;
    case 1:
	var [r, g, b] = [n, v, m];
	break;
    case 2:
	var [r, g, b] = [m, v, k];
	break;
    case 3:
	var [r, g, b] = [m, n, v];
	break;
    case 4:
	var [r, g, b] = [k, m, v];
	break;
    case 5:
	var [r, g, b] = [v, m, n];
	break;
    }
    return [(r*255) >> 0, (g*255) >> 0, (b*255) >> 0];
}

/*
 * HSL <=> RGB
 */
function RGB2HSL(rgb) {
    var [h, s, v] = RGB2HSV(rgb);
    var l =  v * (2 - s) / 2;
    return [h, s, l];
}

function HSL2RGB(hsl) {
    var [h, s, l] = hsl;
    var v = l * 2 / (2 - s);
    return HSV2RGB([h, s, v]);
}

/*
 * Xyb <=> RGB (Butteraugli)
 * X:red<=>green, y:yellow, b:blue
 */
function RGB2Xyb(rgb) {
    var [r, g, b] = rgb;
    return [ (r - g)/2 + 128, // X
	     (r + g)/2, // y
	     b ];     // b
}

function Xyb2RGB(xyb) {
    var [x, y, b] = xyb;
    return [ x + y -128, // r
	    -x + y +128, // g
	     b ];    // b
}

function normalizeRGBA_max(rgba) {
    var a = 255 / Math.max.apply(null, rgba.slice(0, 3));
    return rgba.map(function(v) { return v * a; } );
}

function normalizeRGBA_distance(rgba) {
    var [r, g, b] = rgba;
    var a = 255 / Math.sqrt(r*r + g*g + b*b);
    return rgba.map(function(v) { return v * a; } );
}

