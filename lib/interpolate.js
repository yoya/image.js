"use strict";
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function cubicBCcoefficient(b, c) {
    var p = 2 - 1.5*b - c;
    var q = -3 + 2*b + c;
    var r = 0;
    var s = 1 - (1/3)*b;
    var t = -(1/6)*b - c;
    var u = b + 5*c;
    var v = -2*b - 8*c;
    var w = (4/3)*b + 4*c;
    return [p, q, r, s, t, u, v, w];
}

function cubicBC(x, coeff) {
    var [p, q, r, s, t, u, v, w] = coeff;
    var y = 0;
    var ax = Math.abs(x);
    if (ax < 1) {
      //y = p*(ax*ax*ax) + q*(ax*ax) + r*(ax) + s;
        y = ((p*ax + q)*ax + r)*ax + s;
    } else if (ax < 2) {
      //y = t*(ax*ax*ax) + u*(ax*ax) + v*(ax) + w;
        y = ((t*ax + u)*ax + v)*ax + w;
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

