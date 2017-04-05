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
function XYZ2sRGB(lxyz) {
    var [lx, ly, lz] = lxyz;
    // linear sRGB
    var lr =  3.2410 * lx - 1.5374 * ly - 0.4986 * lz;
    var lg = -0.9692 * lx + 1.8760 * ly + 0.0416 * lz;
    var lb =  0.0556 * lx - 0.2040 * ly + 1.0570 * lz;
    var rgb = [];
    // gamma
    // http://en.wikipedia.org/wiki/SRGB
    for (var lv of [lr, lg, lb]) {
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
