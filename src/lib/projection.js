'use strict';

/*
 * 2017/05/30- (c) yoya@awm.jp
 */

/*
   ref) https://trac.ffmpeg.org/attachment/wiki/RemapFilter/projection.c
   equirectangular2xyz, xyz2equirectangular
   fisheye2xyz, xyz2fisheye
*/

function equirectangular2xyz(x, y, width, height) {
    const theta = (1.0 - x / width) * Math.PI;
    const phi = (y / height) * Math.PI;
    const xx = Math.cos(theta) * Math.sin(phi);
    const yy = Math.sin(theta) * Math.sin(phi);
    const zz = Math.cos(phi);
    return [xx, yy, zz];
}

function xyz2equirectangular(xyz, width, height) {
    const [x, y, z] = xyz;
    const phi = Math.acos(z);
    const theta = Math.acos(x / Math.sin(phi));
    const xx = (1.0 - theta / Math.PI) * width;
    const yy = phi / Math.PI * height;
    return [xx, yy];
}

//

function fisheye2xyz(x, y, width, height) {
    const theta = Math.atan2(y / height - 0.5, x / width - 0.5);
    if (Math.abs(Math.abs(theta) - Math.PI / 2) < Math.PI / 4) {
	var phi2_over_pi = (y / height - 0.5) / Math.sin(theta);
    } else {
	var phi2_over_pi = (x / width - 0.5)  / Math.cos(theta);
    }
    if (phi2_over_pi > 0.5) {
	return null;
    }
    const phi = phi2_over_pi * Math.PI;
    const xx =   Math.cos(theta) * Math.sin(phi);
    const yy =   Math.cos(phi);
    const zz = -Math.sin(theta) * Math.sin(phi);
    return [xx, yy, zz];
}

function xyz2fisheye(xyz, width, height, srcProjX, srcProjY, srcProjR) {
    const [x, y, z] = xyz;
    const theta = Math.atan2(-z, x);
    const phi2_over_pi = Math.acos(y) / Math.PI;
    const wh = (width + height) / 2;
    let xx = (phi2_over_pi * Math.cos(theta)) * wh;
    let yy = (phi2_over_pi * Math.sin(theta)) * wh;
    xx = (xx - width / 2) *  srcProjR + width / 2 + srcProjX * width;
    yy = (yy - height / 2) * srcProjR + height / 2 + srcProjY * height;
    return [xx, yy];
}
