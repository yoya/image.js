"use strict";
/*
 * 2019/10/24- (c) yoya@awm.jp
 */

(function(exports){

exports.average = function(arr) {
    var len = arr.length;
    var ave = 0;
    for (var i = 0 ; i < len ; i++) {
        ave += arr[i];
    }
    return ave / len;
}
    
exports.variance = function(arr, ave) {
    var len = arr.length;
    var v = 0;
    for (var i = 0 ; i < len ; i++) {
        v  += (arr[i] - ave) ** 2;
    }
    return v / len;
}

exports.variance_covariance = function(arr1, arr2, ave) {
    var len = arr1.length;
    var v1 = 0, v2 = 0, cov = 0;
    for (var i = 0 ; i < len ; i++) {
        var d1 = arr1[i] - ave;
        var d2 = arr2[i] - ave;
        v1  += d1 * d1;
        v2  += d2 * d2;
        cov += d1 * d2;
        console.log("d1, d2, v1, v2, cov:", d1, d2, v1, v2, cov);
    }
    return [v1 / len, v2 / len, cov / len];
}
    
exports.max_min = function(arr) {
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

}(typeof exports === 'undefined' ? this.Statistics = {} : exports));
