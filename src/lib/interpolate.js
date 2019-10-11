'use strict';
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function cubicBCcoefficient(b, c) {
    const p = 2 - 1.5 * b - c;
    const q = -3 + 2 * b + c;
    const r = 0;
    const s = 1 - (1 / 3) * b;
    const t = -(1 / 6) * b - c;
    const u = b + 5 * c;
    const v = -2 * b - 8 * c;
    const w = (4 / 3) * b + 4 * c;
    return [p, q, r, s, t, u, v, w];
}

function cubicBC(x, coeff) {
    const [p, q, r, s, t, u, v, w] = coeff;
    let y = 0;
    const ax = Math.abs(x);
    if (ax < 1) {
      // y = p*(ax*ax*ax) + q*(ax*ax) + r*(ax) + s;
        y = ((p * ax + q) * ax + r) * ax + s;
    } else if (ax < 2) {
      // y = t*(ax*ax*ax) + u*(ax*ax) + v*(ax) + w;
        y = ((t * ax + u) * ax + v) * ax + w;
    }
    return y;
}

function lanczos(x, lobe) {
    if (x === 0) {
	return 0;
    }
    if (Math.abs(x) < lobe) {
	return sinc(x) * sinc(x / lobe);
    }
    return 0;
}

function lanczosFast(x, lobe) {
    if (x === 0) {
	return 0;
    }
    if (Math.abs(x) < lobe) {
	return sincFast(x) * sincFast(x / lobe);
    }
    return 0;
}
