"use strict";
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function gaussian(x, y, sigma) {
    var sigma2 = sigma * sigma;
    return Math.exp(- (x*x + y*y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
}

function pascalTriangle(n) {
    var arr = new Uint16Array(n + 1);
    if (n <= 1) {
	return (n <= 0)?[1]:[1, 1];
    }
    var arr1 = pascalTriangle(n-1);
    arr[0] = arr1[0];
    for (var i = 1 ; i < n ; i++) {
	arr[i] = arr1[i-1] +  arr1[i];
    }
    arr[n] = arr1[n-1];
    return arr;
}

