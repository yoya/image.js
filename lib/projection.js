"use strict";

/*
 * 2017/05/30- (c) yoya@awm.jp
 */

// ref) https://trac.ffmpeg.org/attachment/wiki/RemapFilter/projection.c
function fisheye2xyz(x, y, width, height) {
    var theta2 = Math.atan2(y/height - 0.5, x/width - 0.5);
    if (Math.abs(Math.abs(theta2) - Math.PI/2) < Math.PI/4) {
	var phi2_over_pi = (y/height - 0.5) / Math.sin(theta2);
    } else {
	var phi2_over_pi = (x/width - 0.5) / Math.cos(theta2);
    }
    var yy =  Math.cos(phi2_over_pi * Math.PI);
    var zz = - Math.sin(theta2);
    var xx =   Math.cos(theta2);
    if (0.5 < phi2_over_pi) {
	return null;
    }
    var a = Math.sqrt((1 - yy*yy) / (xx*xx + zz*zz)); // x^2+y^2+z^2 = 1.0
    return [a * xx, yy, a * zz];
}

function xyz2equirectangular(xyz, width, height) {
    var [x, y, z] = xyz;
    var phi = Math.acos(z);
    var theta = Math.acos(x / Math.sin(phi));
    var yy = phi / Math.PI * height;
    var xx =  (1.0 - theta / Math.PI) * width;
    return [xx, yy];
}

function equirectangular2xyz(x, y, width, height) {
    var theta = (1.0 - x / width) * Math.PI;
    var phi = (y / height) * Math.PI;
    var xx = Math.cos(theta) * Math.sin(phi);
    var yy = Math.sin(theta) * Math.sin(phi);
    var zz = Math.cos(phi);
    return [xx, yy, zz];
}

function xyz2fisheye(xyz, width, height) {
    var [x, y, z] = xyz;
    var theta2 = Math.atan2(-z, x);
    var phi2_over_pi = Math.acos(y) / Math.PI;
    var xx = ((phi2_over_pi * Math.cos(theta2)) + 0.5) * width;
    var yy = ((phi2_over_pi * Math.sin(theta2)) + 0.5) * height;
    return [xx, yy];
}
