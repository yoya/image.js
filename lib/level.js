"use strict";
/*
 * 2018/04/23- (c) yoya@awm.jp
 */

function sigmoid(x, a, b) {
    // return 1.0/(1.0 + Math.exp(a * (b - x)));
    return Math.tanh(0.5*a * (x-b)) + 1.0; // equal to exp but only scaled.
}
