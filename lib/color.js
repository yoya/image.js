"use strict";
/*
 * 2017/04/05- (c) yoya@awm.jp
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

// http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html
function XYZ2RGB(lxyz) { // to linear RGB
    var [lx, ly, lz] = lxyz;
    // linear sRGB
    var r =  3.2410 * lx - 1.5374 * ly - 0.4986 * lz;
    var g = -0.9692 * lx + 1.8760 * ly + 0.0416 * lz;
    var b =  0.0556 * lx - 0.2040 * ly + 1.0570 * lz;
    return [r, g, b];
}

// http://en.wikipedia.org/wiki/SRGB
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

// http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html
function RGB2XYZ(lrgb) { // from linear RGB
    var [lr, lg, lb] = lrgb;
    // linear sRGB
    var lx = 0.4124 * lr + 0.3576 * lg + 0.1805 * lb;
    var ly = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    var lz = 0.0193 * lr + 0.1192 * lg + 0.9505 * lb;
    return [lx, ly, lz];
}

// http://en.wikipedia.org/wiki/SRGB
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
