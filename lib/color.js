"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
 */

function lumaFromRGBA(rgba) {
    const [r,g,b,a] = rgba;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y * a / 255;
    // return y;
}

/*
 * xy <=> XYZ
 */
function xy2XYZ(xy) {
    const [x, y] = xy;
    const xyz = new Float32Array(3);
    const ly = y;
    xyz[0] = (x / y) * ly;  // x
    xyz[1] = ly;  // y
    xyz[2] = (1 - x - y) / y * ly;  // z
    return xyz;
}

function XYZ2xy(lxyz) {
    const [lx, ly, lz] = lxyz;
    const xy = new Float32Array(2);
    xy[0] = lx / (lx + ly + lz);  // x
    xy[1] = ly / (lx + ly + lz);  // y
    return xy;
}

/*
 * XYZ <=> RGB
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html
 */
function XYZ2RGB(xyz) { // to linear RGB
    const [x, y, z] = xyz;
    const rgb = new Float32Array(3);
    // linear sRGB
    rgb[0] =  3.2410 * x - 1.5374 * y - 0.4986 * z;  // r
    rgb[1] = -0.9692 * x + 1.8760 * y + 0.0416 * z;  // g
    rgb[2] =  0.0556 * x - 0.2040 * y + 1.0570 * z;  // b
    return rgb;
}

function RGB2XYZ(lrgb) { // from linear RGB
    const [lr, lg, lb] = lrgb;
    const xyz = new Float32Array(3);
    // linear sRGB
    xyz[0] = 0.4124 * lr + 0.3576 * lg + 0.1805 * lb;  // x
    xyz[1] = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;  // y
    xyz[2] = 0.0193 * lr + 0.1192 * lg + 0.9505 * lb;  // z
    return xyz;
}

/*
 * linear RGB <=> sRGB
 * http://en.wikipedia.org/wiki/SRGB
 */
// exports.linearRGB2sRGB = linearRGB2sRGB;
function linearRGB2sRGB(lrgb) {
    const n = lrgb.length;
    const rgb = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) {
        const lv = lrgb[i]
        let v;
	if (lv < 0.0031308) {
	    v = 12.92 * lv;
	} else {
	    v = 1.055 * Math.pow(lv, 1/2.4) - 0.055;
	}
	v *= 255;
	rgb[i] = v;
    }
    return rgb;
}

// exports.sRGB2linearRGB = sRGB2linearRGB;
function sRGB2linearRGB(rgb) {
    const n = rgb.length;
    const lrgb = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const v = rgb[i] / 255;
        let lv;
	if (v <= 0.04045) {
	    lv = v / 12.92;
	} else {
	    lv = Math.pow((v + 0.055) / 1.055, 2.4) ;
	}
	lrgb[i] = lv;
    }
    return lrgb;
}

/*
 * XYZ <=> sRGB
 */
function XYZ2sRGB(lxyz) {
    // to linear sRGB
    const rgb = XYZ2RGB(lxyz);
    // gamma correction
    return linearRGB2sRGB(rgb);
}

function sRGB2XYZ(rgb) {
    // gamma correction
    const lrgb = sRGB2linearRGB(rgb);
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
    const [x, y] = xy;
    const uv = new Float32Array(2);
    uv[0] = 4 * x / ( -2*x + 12*y + 3);
    uv[1] = 6 * y / ( -2*x + 12*y + 3);
    return uv;
}

function uv2xy(uv) {
    const [u, v] = uv;
    const xy = new Float32Array(2);
    xy[0] = 3 * u / (2*u - 8*v + 4);
    xy[1] = 2 * v / (2*u - 8*v + 4);
    return xy;
}

function xy2uava(xy) {
    const [x, y] = xy;
    const uava = new Float32Array(2);
    uava[0] = 4 * x / ( -2*x + 12*y + 3);
    uava[1] = 9 * y / ( -2*x + 12*y + 3);
    return uava;
}

function uava2xy(uava) {
    const [ua, va] = uava;
    const xy = new Float32Array(2);
    xy[0] = 9 * ua / (6*ua - 16*va + 12);
    xy[1] = 4 * va / (6*ua - 16*va + 12);
    return xy;
}

function xy2uv_judd(xy) {
    const [x, y] = xy;
    const uv = new Float32Array(2);
    uv[0] = (5.5932*x + 1.9116*y) / (-1.882*x + 12*y + 2.9088)
    uv[1] = 7.8972*y / (-1.882*x + 12*y + 2.9088)
    return uv;
}
function uv2xy_judd(uv) {
    const [u, v] = uv;
    const xy = new Float32Array(2);
    xy[0] = (2.8714*u - 0.6951*v) / (1.8578*u - 8.8395*v + 5.5213)
    xy[1] = 2.0337*v / (1.8578*u - 8.8395*v + 5.5213)
    return xy;
}


/*
 * RGB <= CMYK naive convert
 */
function RGB2CMYK(rgb) {
    const [r, g, b] = rgb;
    const k = 255 - Math.max(r, g, b);
    const cmyk = new Uint8ClampedArray(4);
    if (k == 255) {
        cmyk[0] = cmyk[1] = cmyk[2] = 0;
    } else {
        cmyk[0] = 255 * ( 255 - r - k) / (255 - k);  // c
	cmyk[1] = 255 * ( 255 - g - k) / (255 - k);  // m
        cmyk[2] = 255 * ( 255 - b - k) / (255 - k);  // y
    }
    cmyk[3] = k;
    return cmyk;
}

function CMYK2RGB(cmyk) {
    const [c, m, y, k] = cmyk;
    const rgb = new Uint8ClampedArray(3);
    rgb[0] = 255 - Math.min(255, c * (255 - k)/255 + k);  // r
    rgb[1] = 255 - Math.min(255, m * (255 - k)/255 + k);  // g
    rgb[2] = 255 - Math.min(255, y * (255 - k)/255 + k);  // b
    return rgb;
}

function RGB2CMY(rgb) {
    const [r, g, b] = rgb;
    const cmy = new Uint8ClampedArray(3);
    cmy[0] = 255 - r;  // c
    cmy[1] = 255 - g;  // m
    cmy[2] = 255 - b;  // y
    return cmy;
}

/*
 * RGB <=> YCbCr (JPEG)
 */
function RGB2YCbCr(rgb) {
    const [r, g, b] = rgb;
    const ycbcr = new Uint8ClampedArray(3);
    ycbcr[0] =  0.299  * r + 0.587  * g + 0.114  * b;  // y
    const _cb = -0.1687 * r - 0.3313 * g + 0.5    * b;
    const _cr =  0.5    * r - 0.4187 * g - 0.0813 * b;
    ycbcr[1] = _cr + 128;  // cb
    ycbcr[2] = _cr + 128;  // cr
    return ycbcr;
}

function YCbCr2RGB(ycbcr) {
    const [y, cb, cr] = ycbcr;
    const rgb = new Uint8ClampedArray(3);
    const _cb = cb - 128;
    const _cr = cr - 128;
    rgb[0] = y                 + 1.402   * _cr;  // r
    rgb[1] = y - 0.34414 * _cb - 0.71414 * _cr;  // g
    rgb[2] = y + 1.772   * _cb                ;  // b
    return rgb;
}

/*
  YIQ (0-255) <=> RGB
  https://en.wikipedia.org/wiki/YIQ
*/
function RGB2YIQ(rgb) {
    const [r, g, b] = rgb;
    const yiq = new Uint8ClampedArray(3);
    yiq[0] = 0.299 * r + 0.587 * g + 0.114 * b;  // y
    const _i = 0.596 * r - 0.274 * g - 0.322 * b;  // b - y
    const _q = 0.211 * r - 0.523 * g + 0.312 * b;  // r - y
    yiq[1] = _i + 128;  // i
    yiq[2] = _q + 128;  // q
    return yiq;
}

function YIQ2RGB(yiq) {
    const [y, i, q] = yiq;
    const rgb = new Uint8ClampedArray(3);
    const _i = i - 128;
    const _q = q - 128;
    rgb[0] = y + 0.956 * _i + 0.621 * _q;
    rgb[1] = y - 0.272 * _i - 0.647 * _q;
    rgb[2] = y - 1.106 * _i + 1.703 * _q;
    return rgb;
}

/*
  YUV (PAL - SDTV BT.601) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT601(rgb) {
    const [r, g, b] = rgb;
    const yuv = new Uint8ClampedArray(3);
    yuv[0] =   0.299   * r + 0.587   * g + 0.114   * b;  // y
    yuv[1] = - 0.14713 * r - 0.28886 * g + 0.436   * b  + 128;  // u
    yuv[2] =   0.615   * r - 0.51499 * g - 0.10001 * b  + 128;  // v
    return yuv;
}
function YUV2RGB_BT601(yuv) {
    const [y, u, v] = yuv;
    const rgb = new Uint8ClampedArray(3);
    const _u = u - 128;
    const _v = v - 128;
    rgb[0] = y                + 1.13983 * _v;  // r
    rgb[1] = y - 0.39465 * _u - 0.58060 * _v;  // g
    rgb[2] = y + 2.03211 * _u               ;  // b
    return rgb;
}

/*
  YUV (PAL - HDTV - BT.709) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
function RGB2YUV_BT709(rgb) {
    const [r, g, b] = rgb;
    let yuv = new Uint8ClampedArray(3);
    yuv[0] =   0.2126  * r + 0.7152  * g + 0.0722  * b;  // y
    const _u = - 0.09991 * r - 0.33609 * g + 0.436   * b;
    const _v =   0.615   * r - 0.55861 * g - 0.05639 * b;
    yuv[1] = _u + 128;  // u
    yuv[2] = _v + 128;  // v
    return yuv;
}
function YUV2RGB_BT709(yuv) {
    const [y, u, v] = yuv;
    const rgb = new Uint8ClampedArray(3);
    const _u = u - 128;
    const _v = v - 128;
    rgb[0] = y                + 1.28033 * _v;  // r
    rgb[1] = y - 0.21482 * _u - 0.38059 * _v;  // g
    rgb[2] = y + 2.12798 * _u               ;  // b
    return rgb;
}

/*
 * RGB <=> YDbDr (SECOM)
 http://mntone.hateblo.jp/entry/2017/04/01/023417
 */
function RGB2YDbDr(rgb) {
    const [r, g, b] = rgb;
    const ydbdr = new Uint8ClampedArray(3);
    ydbdr[0] =  0.299 * r + 0.587 * g + 0.114 * b;  // y
    const _db = -0.450 * r - 0.883 * g + 1.333 * b;
    const _dr = -1.333 * r + 1.116 * g + 0.217 * b;
    ydbdr[1] = _db / 2.666 + 128;  // db
    ydbdr[2] = _dr / 2.666 + 128;  // dr
    return ydbdr;
}

/*
  http://mntone.hateblo.jp/entry/2017/04/01/023417
*/

function YDbDr2RGB(ydbdr) {
    const y = ydbdr[0], db = ydbdr[1], dr = ydbdr[2];
    const _db = (db - 128) * 2.666;
    const _dr = (dr - 128) * 2.666;
    const rgb = new Uint8ClampedArray(3);
    rgb[0] = y + 0.000092303716148 * _db - 0.525912630661865 * _dr;  // r
    rgb[1] = y - 0.129132898890509 * _db + 0.267899328207599 * _dr;  // g
    rgb[2] = y + 0.664679059978955 * _db - 0.000079202543533 * _dr;  // b
    return rgb;
}

/*
  HSV(360.0, 1.0, 1.0) <~> RGB
  https://en.wikipedia.org/wiki/HSL_and_HSV
*/
function RGB2HSV(rgb) {
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const max_min = max - min;
    const v = max / 255;
    const s = max? ((max_min) / max): 0;
    let h;
    if ((r > g) && (r > b)) { // R max
	h = (g - b) / (max_min);
	if (h < 0) { h += 6; }
    } else if (g > b){ // G max
	h = (b - r) / (max_min) + 2;
    } else if (b > g){ // B max
	h = (r - g) / (max_min) + 4;
    } else {
	h = 0;
    }
    h = h * 60;
    return [h, s, v];
}
// http://hooktail.org/computer/index.php?RGB%A4%AB%A4%E9HSV%A4%D8%A4%CE%CA%D1%B4%B9%A4%C8%C9%FC%B8%B5
function HSV2RGB(hsv) {
    let [h, s, v] = hsv;
    h = (h<0)? (h + 360): (h%360); // don't care for 2-loop negative.
    const h2 = (h / 60) >> 0;
    const f = h/60 - h2;
    const m = v * (1 - s);
    const n = v * (1 - s * f);
    const k = v * (1 - s * (1 - f));
    let r, g, b;
    switch (h2) {
    case 0:
        [r, g, b] = [v, k, m];
	break;
    case 1:
	[r, g, b] = [n, v, m];
	break;
    case 2:
	[r, g, b] = [m, v, k];
	break;
    case 3:
	[r, g, b] = [m, n, v];
	break;
    case 4:
	[r, g, b] = [k, m, v];
	break;
    case 5:
	[r, g, b] = [v, m, n];
	break;
    }
    const rgb = Uint8ClampedArray.from([r * 255, g * 255, b * 255]);
    return rgb;
}

/*
 * HSL <=> RGB
 https://gist.github.com/emanuel-sanabria-developer/5793377
*/

function RGB2HSL(rgb) {
    const [r, g, b] = [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const c = (max + min);
    let h, s;
    const l = c / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = (l > 0.5)? (d / (2 - c)): (d / c);
        if (max === r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max === g) {
            h = (b - r) / d + 2;
        } else { // max === b
            h = (r - g) / d + 4;
        }
        h *= 60;
    }
    return [h, s, l];
}

// https://gist.github.com/emanuel-sanabria-developer/5793377
function HSL2RGB(hsl) {
    const [h, s, l] = hsl;
    const v = l * 2 / (2 - s);
    return HSV2RGB([h, s, v]);
}

/*
 * Xyb <=> RGB (naive convertion, not Butteraugli)
 * X:red<=>green, y:yellow, b:blue
 */
function RGB2Xyb(rgb) {
    const [r, g, b] = rgb;
    const xyb = new Uint8ClampedArray(3);
    xyb[0] = (r - g)/2 + 128;  // X
    xyb[1] = (r + g)/2;        // y
    xyb[2] = b;                // b
    return xyb;
}

function Xyb2RGB(xyb) {
    const [x, y, b] = xyb;
    const rgb = new Uint8ClampedArray(3);
    rgb[0] =  x + y - 128;  // r
    rgb[1] = -x + y + 128;  // g
    rgb[2] =  b;            // b
    return rgb;
}

function normalizeRGBA_max(rgba) {
    const a = 255 / Math.max.apply(null, rgba.slice(0, 3));
    return rgba.map(function(v) { return v * a; } );
}

function normalizeRGBA_distance(rgba) {
    const [r, g, b] = rgba;
    const a = 255 / Math.sqrt(r*r + g*g + b*b);
    return rgba.map(function(v) { return v * a; } );
}

function _similarRGBA(v1, v2, fuzz) {
    var diff = (v2 > v1)? (v2 - v1): v1 - v2;;
    return (diff/255 <= fuzz);
}

function similarRGBA(rgba, rgba2, fuzz) {
    var [r, g, b, a] = rgba;
    var [r2, g2, b2, a2] = rgba2;
    if ( _similarRGBA(r, r2, fuzz) && _similarRGBA(g, g2, fuzz) &&
         _similarRGBA(b, b2, fuzz) && _similarRGBA(a, a2, fuzz) ) {
        return true
    }
    return false;
}
