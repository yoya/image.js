"use strict";
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function cubicBCcoefficient(b, c) {
    var p = 12 - 9 * b - 6 * c;
    var q = -18 + 12 * b + 6 * c;
    var r = 0;
    var s = 6 - 2 * b;
    var t = -b - 6 * c;
    var u = 6 * b + 30 * c;
    var v = -12 * b - 48 * c;
    var w = 8 * b + 24 * c;
    return [p, q, r, s, t, u, v, w];
}

function cubicBC(x, coeff) {
    var [p, q, r, s, t, u, v, w] = coeff;
    var y = 0;
    var ax = Math.abs(x);
    if (ax < 1) {
	y = (1/6) * (p*(ax*ax*ax) + q*(ax*ax) + r*(ax) + s);
    } else if (ax < 2) {
	y = (1/6) * (t*(ax*ax*ax) + u*(ax*ax) + v*(ax) + w);
    }
    return y;
}

function lanczos(x, lobe) {
    if (x === 0) {
	return 0;
    }
    if (Math.abs(x) < lobe) {
	return sinc(x) * sinc(x/lobe);
    }
    return 0;
}

function lanczosFast(x, lobe) {
    if (x === 0) {
	return 0;
    }
    if (Math.abs(x) < lobe) {
	return sincFast(x) * sincFast(x/lobe);
    }
    return 0;
}

