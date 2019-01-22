"use strict";
/*
 * 2018/01/21- (c) yoya@awm.jp
 */

function getTestcardImage(width, height) {
    var primaryColors = [
        [255,   0,   0],  // red
        [255, 255,   0],  // yellow
        [  0, 255,   0],  // green
        [  0, 255, 255],  // cyan
        [  0,   0, 255],  // blue
        [255,   0, 255],  // magenta
    ];
    var image = new ImageData(width, height);
    var [xdiv, ydiv]  = [16, 9];
    var [xunit,yunit] = [width / xdiv, height / ydiv];
    var [xunit_center, yunit_center] = [xunit/2, yunit/2];
    for (var y = 0 ; y < height ; y++) {
        for (var x = 0 ; x < width ; x++) {
            var [xi, yi] = [(x/xunit)|0, (y/yunit)|0];
            var xx = x - xi*xunit;
            var yy = y - yi*yunit;
            // primary color
            var [r, g, b] = primaryColors[(xi^(yi+1)) % primaryColors.length];
            if (xi == (xdiv - 1)) {
                [r, g, b] = primaryColors[(xi^(((yi/2)|0)+1)) % primaryColors.length];
            }
            if (yi == (ydiv - 1)) {
                [r, g, b] = primaryColors[(((xi/2)|0)^(yi+1)) % primaryColors.length];
            }
            // middle area to gray
            if (((0 < xi) && (xi < (xdiv-1)) &&
                 (0 < yi) && (yi < (ydiv-1))) ) {
                [r, g, b] = [187,187,187];  // sRGB half luminant.
            }
            // primary color in black & white
            if ((1 < xi) && (xi < (xdiv - 2)) && (yi == 1)) {
                var xxx = xx - xunit_center/2;
                var yyy = yy - yunit_center/2;
                if ((0 < xxx) && (xxx < xunit_center) &&
                    (0 < yyy) && (yyy < yunit_center )) {
                    [r, g, b] = primaryColors[(xi^yi) % primaryColors.length];
                } else {
                    if (xi < 8) {
                        [r, g, b] = [0, 0, 0];
                    } else {
                        [r, g, b] = [255, 255, 255];
                    }
                }
            }
            // black & white
            if ((1 < xi) && (xi < (xdiv - 2)) && (yi == 2)) {
                var v = (xi%2)?255:0;
                [r, g, b] = [v, v, v];
            }
            // grascale
            if ((1 < xi) && (xi < (xdiv - 2)) && (yi == (ydiv - 3))) {
                var v = 255 * (xi-2) / (xdiv - 5);
                [r, g, b] = [v, v, v];
            }
            // contrast horizontal
            if ((1 < xi) && (xi < (xdiv - 2)) && (yi == (ydiv - 2))) {
                var v = (((x/(xi-1))|0)%2)?255:0;
                [r, g, b] = [v, v, v];
            }
            // contrast vertical
            if ((xi == (xdiv -2)) &&  (0 < yi) && (yi < (ydiv - 1))) {
                var v = (((y/yi)|0)%2)?255:0;
                [r, g, b] = [v, v, v];
            }
            // czp
            if ((xi == 1) &&  (0 < yi) && (yi < (ydiv - 1))) {
                
                var [rr, gg, bb] = [255,255,255];
                if (yi < (ydiv - 2)) {
                    var [rr, gg, bb] = primaryColors[((xi-1)^(yi+1)) % primaryColors.length];
                }
                var scale = 4;
                var cx = Math.PI / xunit / scale;
                var cy = Math.PI / yunit / scale;
                var v = Math.sin(cx*xx*xx + cy*yy*yy);
                [r, g, b] = [rr*v, gg*v, bb*v];
            }
            // border
            if (((x % xunit) < 3)|| ((x % xunit) > (xunit-3)) ||
                ((y % yunit) < 2) || ((y % yunit) > (yunit-2))) {
                [r, g, b] = [0, 0, 0];
            }
            setRGBA(image, x, y, [r, g, b, 255]);
        }
    }
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    for (xi = 2 ; xi <= (xdiv - 3) ; xi+= xdiv - 5) {
        for (yi = 3; yi < (ydiv - 3) ; yi++) {
            canvas.width = xunit;
            canvas.height = yunit;
            var x = xi*xunit;
            var y = yi*yunit;
            var fontSize = yunit*0.8;
            var weight = 20;
            var textList = [["0", "1", "2"], [ "A","B", "C" ]];
            var text = textList[(xi==2)?0:1][yi-3];
            ctx.font = ""+weight+" "+fontSize+"px Arial";
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillStyle ="white";
            ctx.strokeStyle ="black";
            ctx.lineWidth = 3;
            ctx.fillText(text, xunit/2, yunit/2 +3);
            ctx.strokeText(text, xunit/2, yunit/2 +3);
            var textImage = ctx.getImageData(0, 0, xunit, yunit);
            overlayImageData(textImage, image, 0, 0, x, y);
        }
    }
    return image;
}
