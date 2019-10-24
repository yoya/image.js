"use strict";
/*
 * 2019/10/24- (c) yoya@awm.jp
 */

(function(exports){

exports.average = average;
function average(arr) {
    console.assert("length" in arr);
    var len = arr.length;
    var ave = 0;
    for (var i = 0 ; i < len ; i++) {
        ave += arr[i];
    }
    return ave / len;
}

exports.variance = variance;
function variance(arr, ave) {
    console.assert("length" in arr);
    console.assert(typeof ave === "number");
    var len = arr.length;
    var v = 0;
    for (var i = 0 ; i < len ; i++) {
        v  += (arr[i] - ave) ** 2;
    }
    return v / len;
}

exports.variance_covariance = variance_covariance;
function variance_covariance(arr1, arr2, ave1, ave2) {
    console.assert("length" in arr1);
    console.assert("length" in arr2);
    console.assert(typeof ave === "number");
    var len = arr1.length;
    var v1 = 0, v2 = 0, cov = 0;
    for (var i = 0 ; i < len ; i++) {
        var d1 = arr1[i] - ave1;
        var d2 = arr2[i] - ave2;
        v1  += d1 * d1;
        v2  += d2 * d2;
        cov += d1 * d2;
    }
    return [v1 / len, v2 / len, cov / len];
}

exports.max_min = max_min;
function max_min(arr) {
    console.assert("length" in arr);
    var len = arr.length;
    var max = 0;
    var min = Number.MAX_VALUE;
    for (var i = 0 ; i < len ; i++) {
        if (max < arr[i]) {
            max = arr[i];
        }
        if (min > arr[i]) {
            min = arr[i];
        }
    }
    return [max, min];
}

exports.normalize = normalize;
function normalize(arr, max) {
    console.assert("length" in arr);
    console.assert(typeof max === "number");
    var len = arr.length;
    var [src_max, src_min] = max_min(arr);
    console.log(src_max, src_min);
    var a = max / (src_max - src_min);
    var arr2 = new arr.constructor(len);
    for (var i = 0 ; i < len ; i++) {
        arr2[i] = (arr[i] - src_min) * a;
    }
    return arr2;
}

}(typeof exports === 'undefined' ? this.Statistics = {} : exports));
