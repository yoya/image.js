'use strict';
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function sinc(x) {
    const pi_x = Math.PI * x;
    return Math.sin(pi_x) / pi_x;
}

function sincFast(x) {
    const xx = x * x;
    // quantim depth 8
    const c0 = 0.173610016489197553621906385078711564924e-2;
    const c1 = -0.384186115075660162081071290162149315834e-3;
    const c2 = 0.393684603287860108352720146121813443561e-4;
    const c3 = -0.248947210682259168029030370205389323899e-5;
    const c4 = 0.107791837839662283066379987646635416692e-6;
    const c5 = -0.324874073895735800961260474028013982211e-8;
    const c6 = 0.628155216606695311524920882748052490116e-10;
    const c7 = -0.586110644039348333520104379959307242711e-12;
    const p =
	c0 + xx * (c1 + xx * (c2 + xx * (c3 + xx * (c4 + xx * (c5 + xx * (c6 + xx * c7))))));
    return (xx - 1.0) * (xx - 4.0) * (xx - 9.0) * (xx - 16.0) * p;
}

function gaussian(x, y, sigma) {
    const sigma2 = sigma * sigma;
    return Math.exp(-(x * x + y * y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
}

function pascalTriangle(n) {
    const arr = new Float64Array(n + 1);
    if (n <= 1) {
	return (n <= 0) ? [1] : [1, 1];
    }
    const arr1 = pascalTriangle(n - 1);
    arr[0] = arr1[0];
    for (let i = 1; i < n; i++) {
        arr[i] = arr1[i - 1] + arr1[i];
        if ((arr[i] < arr1[i - 1]) || (arr[i] < arr1[i])) {
            arr[i] = 0;
            console.error(n, arr[i]);
        }
    }
    arr[n] = arr1[n - 1];
    return arr;
}
