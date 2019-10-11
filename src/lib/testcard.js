'use strict';
/*
 * 2018/01/21- (c) yoya@awm.jp
 */

function getTestcardImage(width, height) {
    const primaryColors = [
        [255,   0,   0],  // red
        [255, 255,   0],  // yellow
        [0, 255,   0],  // green
        [0, 255, 255],  // cyan
        [0,   0, 255],  // blue
        [255,   0, 255]  // magenta
    ];
    const image = new ImageData(width, height);
    const [xdiv, ydiv]  = [16, 9];
    const [xunit, yunit] = [width / xdiv, height / ydiv];
    const [xunit_center, yunit_center] = [xunit / 2, yunit / 2];
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var [xi, yi] = [(x / xunit) | 0, (y / yunit) | 0];
            const xx = x - xi * xunit;
            const yy = y - yi * yunit;
            // primary color
            let [r, g, b] = primaryColors[(xi ^ (yi + 1)) % primaryColors.length];
            if (xi == (xdiv - 1)) {
                [r, g, b] = primaryColors[(xi ^ (((yi / 2) | 0) + 1)) % primaryColors.length];
            }
            if (yi == (ydiv - 1)) {
                [r, g, b] = primaryColors[(((xi / 2) | 0) ^ (yi + 1)) % primaryColors.length];
            }
            // middle area to gray
            if (((xi > 0) && (xi < (xdiv - 1)) &&
                 (yi > 0) && (yi < (ydiv - 1)))) {
                [r, g, b] = [187, 187, 187];  // sRGB half luminant.
            }
            // primary color in black & white
            if ((xi > 1) && (xi < (xdiv - 2)) && (yi == 1)) {
                const xxx = xx - xunit_center / 2;
                const yyy = yy - yunit_center / 2;
                if ((xxx > 0) && (xxx < xunit_center) &&
                    (yyy > 0) && (yyy < yunit_center)) {
                    [r, g, b] = primaryColors[(xi ^ yi) % primaryColors.length];
                } else {
                    if (xi < 8) {
                        [r, g, b] = [0, 0, 0];
                    } else {
                        [r, g, b] = [255, 255, 255];
                    }
                }
            }
            // black & white
            if ((xi > 1) && (xi < (xdiv - 2)) && (yi == 2)) {
                var v = (xi % 2) ? 255 : 0;
                [r, g, b] = [v, v, v];
            }
            // grascale
            if ((xi > 1) && (xi < (xdiv - 2)) && (yi == (ydiv - 3))) {
                var v = 255 * (xi - 2) / (xdiv - 5);
                [r, g, b] = [v, v, v];
            }
            // contrast horizontal
            if ((xi > 1) && (xi < (xdiv - 2)) && (yi == (ydiv - 2))) {
                var v = (((x / (xi - 1)) | 0) % 2) ? 255 : 0;
                [r, g, b] = [v, v, v];
            }
            // contrast vertical
            if ((xi == (xdiv - 2)) &&  (yi > 0) && (yi < (ydiv - 1))) {
                var v = (((y / yi) | 0) % 2) ? 255 : 0;
                [r, g, b] = [v, v, v];
            }
            // czp
            if ((xi == 1) &&  (yi > 0) && (yi < (ydiv - 1))) {
                var [rr, gg, bb] = [255, 255, 255];
                if (yi < (ydiv - 2)) {
                    var [rr, gg, bb] = primaryColors[((xi - 1) ^ (yi + 1)) % primaryColors.length];
                }
                const scale = 4;
                const cx = Math.PI / xunit / scale;
                const cy = Math.PI / yunit / scale;
                var v = Math.sin(cx * xx * xx + cy * yy * yy);
                [r, g, b] = [rr * v, gg * v, bb * v];
            }
            // border
            if (((x % xunit) < 3) || ((x % xunit) > (xunit - 3)) ||
                ((y % yunit) < 2) || ((y % yunit) > (yunit - 2))) {
                [r, g, b] = [0, 0, 0];
            }
            setRGBA(image, x, y, [r, g, b, 255]);
        }
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    for (xi = 2; xi <= (xdiv - 3); xi += xdiv - 5) {
        for (yi = 3; yi < (ydiv - 3); yi++) {
            canvas.width = xunit;
            canvas.height = yunit;
            var x = xi * xunit;
            var y = yi * yunit;
            const fontSize = yunit * 0.8;
            const weight = 20;
            const textList = [['0', '1', '2'], ['A', 'B', 'C']];
            const text = textList[(xi == 2) ? 0 : 1][yi - 3];
            ctx.font = '' + weight + ' ' + fontSize + 'px Arial';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillText(text, xunit / 2, yunit / 2 + 3);
            ctx.strokeText(text, xunit / 2, yunit / 2 + 3);
            const textImage = ctx.getImageData(0, 0, xunit, yunit);
            overlayImageData(textImage, image, 0, 0, x, y);
        }
    }
    return image;
}
