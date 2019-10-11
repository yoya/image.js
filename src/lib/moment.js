'use strict';
/*
 * 2017/06/18- (c) yoya@awm.jp
 */

function getMomentSet(canvas, reverse) {
    const width = canvas.width; const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, width, height);
    let M00 = 0; let M10 = 0; let M01 = 0;
    for (var y = 0, y_y = -height / 2; y < height; y++, y_y++) {
	for (var x = 0, x_x = -width / 2; x < width; x++, x_x++) {
	    var [v, g, b, a] = getRGBA(imageData, x, y);
	    if (reverse) {
		const [lv] = sRGB2linearRGB([v]);
		[v] = linearRGB2sRGB([1 - lv]);
	    }
	    v *= a / 255;
	    M00 += v;
	    M10 += x * v;
	    M01 += y * v;
	    M11 += x_x * y_y * v;
	    M20 += x_x * x_x * v;
	    M02 += y_y * y_y * v;
	}
    }
    const gx = M10 / M00; const gy = M01 / M00;
    var M11 = 0; var M20 = 0; var M02 = 0;
    for (var y = 0, y_y = -gy; y < height; y++, y_y++) {
	for (var x = 0, x_x = -gx; x < width; x++, x_x++) {
	    var [v, g, b, a] = getRGBA(imageData, x, y);
	    if (reverse) {
		v = 255 - v;
	    }
	    v *= a / 255;
	    M00 += v;
	    M10 += x * v;
	    M01 += y * v;
	    M11 += x_x * y_y * v;
	    M20 += x_x * x_x * v;
	    M02 += y_y * y_y * v;
	}
    }
    return [M00, M10, M01, M11, M20, M02];
}

function getGravityCenter(M00, M10, M01) {
    return [M10 / M00, M01 / M00];
}

function getMomentAngle(M11, M20, M02) {
    return 0.5 * Math.atan2(2 * M11, M20 - M02);
}
