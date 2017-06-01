"use strict";

/*
 * 2017/05/30- (c) yoya@awm.jp
 */

/*
   ref) https://trac.ffmpeg.org/attachment/wiki/RemapFilter/projection.c
   equirectangular2xyz, xyz2equirectangular
   fisheye2xyz, xyz2fisheye
*/

function equirectangular2xyz(x, y, width, height) {
    var theta = (1.0 - x / width) * Math.PI;
    var phi = (y / height) * Math.PI;
    var xx = Math.cos(theta) * Math.sin(phi);
    var yy = Math.sin(theta) * Math.sin(phi);
    var zz = Math.cos(phi);
    return [xx, yy, zz];
}

function xyz2equirectangular(xyz, width, height) {
    var [x, y, z] = xyz;
    var phi = Math.acos(z);
    var theta = Math.acos(x / Math.sin(phi));
    var xx = (1.0 - theta/Math.PI) * width;
    var yy = phi / Math.PI * height;
    return [xx, yy];
}

//

function fisheye2xyz(x, y, width, height) {
    var theta = Math.atan2(y/height - 0.5, x/width - 0.5);
    if (Math.abs(Math.abs(theta) - Math.PI/2) < Math.PI/4) {
	var phi2_over_pi = (y/height - 0.5) / Math.sin(theta);
    } else {
	var phi2_over_pi = (x/width - 0.5)  / Math.cos(theta);
    }
    if (0.5 < phi2_over_pi) {
	return null;
    }
    var phi = phi2_over_pi * Math.PI;
    var xx =   Math.cos(theta) * Math.sin(phi);
    var yy =   Math.cos(phi);
    var zz = - Math.sin(theta) * Math.sin(phi);
    return [xx, yy, zz];
}

function xyz2fisheye(xyz, width, height, srcProjX, srcProjY, srcProjR) {
    var [x, y, z] = xyz;
    var theta = Math.atan2(-z, x);
    var phi2_over_pi = Math.acos(y) / Math.PI;
    var wh = (width + height ) / 2;
    var xx = (phi2_over_pi * Math.cos(theta)) * wh;
    var yy = (phi2_over_pi * Math.sin(theta)) * wh;
    xx = (xx - width/2) *  srcProjR + width/2 + srcProjX * width;
    yy = (yy - height/2) * srcProjR + height/2 + srcProjY * height;
    return [xx, yy];
}
