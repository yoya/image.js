"use strict";
/*
 * 2018/04/23- (c) yoya@awm.jp
 */

function sigmoid(v, a, b) {
    //var a2 = (v - 0.5) * a;
    //return 1.0/(1.0 + Math.exp(-a2));
    return 1.0/(1.0 + Math.exp(a * (b - v)));
    
    //return Math.tanh(a) * v;
}
