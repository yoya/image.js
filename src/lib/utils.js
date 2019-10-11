'use strict';

/*
  2017/01/06- yoya@awm.jp
*/

const Utils = {};

Utils.Clamp = function (x, min, max) {
    if (min < x) {
	return (x < max) ? x : max;
    }
    return min;
};

Utils.LeftPad = function (s, nDigit, padStr) {
    s = padStr.repeat(nDigit) + s;
    return s.substr(-nDigit, nDigit);
};

Utils.ToText = function (arr) {
    if ((typeof arr) === 'number') {
	var n = arr;
	const a = [];
	while (n) {
	    a.push(n % 0xff);
	    n >>= 8;
	}
	arr = a.reverse();
    }
    var n = arr.length;
    if (n < 100 * 1024) { // macOS+Chrome: 122KB OK, 123KB NG
	return String.fromCharCode.apply(null, arr);
    }
	const s = [];
	for (let i = 0; i < n; i++) {
	    s.push(String.fromCharCode(arr[i]));
	}
	return s.join('');
};

Utils.ToHex = function(n, digit) {
    const h = n.toString(16);
    if (digit === undefined || digit <= 1) {
	digit = 2;
    }
    digit = (digit > h.length) ? (digit - h.length) : 0;
    return '0'.repeat(digit) + h;
};

Utils.ToHexArray = function(arr) {
    const hexArr = new Array(arr.length);
    for (const i in arr) {
	hexArr[i] =  this.ToHex(arr[i]);
    }
    return hexArr;
};

/*
 * number
 * quantize
 */
Utils.round = function(n, q) {
    let s, a;
    if (!q) {
	q = 1;
    }
    if (n > 0) {
	s = 1;
	a = n;
    } else {
	s = -1;
	a = -n;
    }
    a = ((a + q / 2) / q) | 0;
    return s * a * q;
};
