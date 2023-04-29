"use strict";
/*
 * 2017/06/13- (c) yoya@awm.jp
 * 2017/10/29- (c) yoya@awm.jp worker
 * 2021/03/06- (c) yoya@awm.jp lib
 */

function mogrifyVignette(imageData, params) {
    var { radius, bias, linearGamma, inverse } = params;
    var { width, height } = imageData;
    //
    var slant = Math.sqrt(width*width + height*height);
    slant *= radius;
    for (var y = 0 ; y < height; y++) {
        for (var x = 0 ; x < width; x++) {
            var dx = (x - (width  / 2)) / (slant/2);
            var dy = (y - (height / 2)) / (slant/2);
            var r = Math.sqrt(dx*dx + dy*dy);
	    var factor = Math.pow(Math.cos(r/2), 4);
	    if (inverse) {
		factor = 1 / factor;
	    }
            factor += bias;
	    if (linearGamma) {
		var rgba = getRGBA(imageData, x, y);
		var [lr, lg, lb, la] = sRGB2linearRGB(rgba);
		lr *= factor;
		lg *= factor;
		lb *= factor;
		[r, g, b, a] = linearRGB2sRGB([lr, lg, lb, la]);
	    } else {
		var [r, g, b, a] = getRGBA(imageData, x, y);
		r *= factor;
		g *= factor;
		b *= factor;
	    }
	    setRGBA(imageData, x, y, [r, g, b, a]);
	}
    }
}

