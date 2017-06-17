"use strict";
/*
 * 2017/06/18- (c) yoya@awm.jp
 */

function getMomentSet(canvas, reverse) {
    var width = canvas.width, height = canvas.height;
    var ctx = canvas.getContext("2d");
    var imageData = ctx.getImageData(0, 0, width, height);
    var M00 = 0, M10 = 0, M01 = 0;
    for (var y = 0, y_y = -height/2; y < height ; y++, y_y++) {
	for (var x = 0, x_x = -width/2 ; x < width ; x++, x_x++) {
	    var [v, g, b, a] = getRGBA(imageData, x, y);
	    if (reverse) {
		var [lv] = sRGB2linearRGB([v]);
		[v] = linearRGB2sRGB([1 - lv]);
	    }
	    v *= a/255;
	    M00 += v;
	    M10 += x * v;
	    M01 += y * v;
	    M11 += x_x * y_y * v;
	    M20 += x_x * x_x * v;
	    M02 += y_y * y_y * v;
	}
    }
    var gx = M10 / M00, gy = M01 / M00;
    var M11 = 0, M20 = 0, M02 = 0;
    for (var y = 0, y_y = -gy; y < height ; y++, y_y++) {
	for (var x = 0, x_x = -gx ; x < width ; x++, x_x++) {
	    var [v, g, b, a] = getRGBA(imageData, x, y);
	    if (reverse) {
		v = 255 - v;
	    }
	    v *= a/255;
	    M00 += v;
	    M10 += x * v;
	    M01 += y * v;
	    M11 += x_x * y_y * v;
	    M20 += x_x * x_x * v;
	    M02 += y_y * y_y * v;
	}
    }
    return [ M00, M10, M01, M11, M20, M02 ];
}

function getGravityCenter(M00, M10, M01) {
    return [M10 / M00, M01 / M00];
}

function getMomentAngle(M11, M20, M02) {
    return 0.5 * Math.atan2(2 * M11 , M20 - M02);
}
