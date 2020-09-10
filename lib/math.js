"use strict";
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function sinc(x) {
    var pi_x = Math.PI * x;
    return Math.sin(pi_x) / pi_x;
}

function sincFast(x) {
    var xx = x * x;
    // quantim depth 8
    var c0 = 0.173610016489197553621906385078711564924e-2;
    var c1 = -0.384186115075660162081071290162149315834e-3;
    var c2 = 0.393684603287860108352720146121813443561e-4;
    var c3 = -0.248947210682259168029030370205389323899e-5;
    var c4 = 0.107791837839662283066379987646635416692e-6;
    var c5 = -0.324874073895735800961260474028013982211e-8;
    var c6 = 0.628155216606695311524920882748052490116e-10;
    var c7 = -0.586110644039348333520104379959307242711e-12;
    var p =
	c0+xx*(c1+xx*(c2+xx*(c3+xx*(c4+xx*(c5+xx*(c6+xx*c7))))));
    return (xx-1.0)*(xx-4.0)*(xx-9.0)*(xx-16.0)*p;
}

function gaussian(x, y, sigma) {
    var sigma2 = sigma * sigma;
    return Math.exp(- (x*x + y*y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
}

function pascalTriangle(n) {
    var arr = new Float64Array(n + 1);
    if (n <= 1) {
	return (n <= 0)?[1]:[1, 1];
    }
    var arr1 = pascalTriangle(n-1);
    arr[0] = arr1[0];
    for (var i = 1 ; i < n ; i++) {
        arr[i] = arr1[i-1] + arr1[i];
        if ((arr[i] < arr1[i-1] ) || (arr[i] < arr1[i])) {
            arr[i] = 0;
            console.error(n, arr[i]);
        }
    }
    arr[n] = arr1[n-1];
    return arr;
}

function homography(x, y, coeff) {
    let [a, b, c, d, e, f, g, h] = coeff;
    let xx = (a*x + b*y + c) / (g*x + h*y + 1);
    let yy = (d*x + e*y + f) / (g*x + h*y + 1);
    return [xx, yy];
}
