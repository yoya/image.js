/*
 * 2017/04/05- (c) yoya@awm.jp
 */

export function lumaFromRGBA(rgba) {
    const [r, g, b, a] = rgba;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    return y * a / 255;
    // return y;
}

/*
 * xy <=> XYZ
 */
export function xy2XYZ(xy) {
    const [x, y] = xy;
    const ly = y;
    const lx = (x / y) * ly;
    const lz = (1 - x - y) / y * ly;
    return [lx, ly, lz];
}

export function XYZ2xy(lxyz) {
    const [lx, ly, lz] = lxyz;
    const x = lx / (lx + ly + lz);
    const y = ly / (lx + ly + lz);
    return [x, y];
}

/*
 * XYZ <=> RGB
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ_RGB.html
 */
export function XYZ2RGB(lxyz) { // to linear RGB
    const [lx, ly, lz] = lxyz;
    // linear sRGB
    const r =  3.2410 * lx - 1.5374 * ly - 0.4986 * lz;
    const g = -0.9692 * lx + 1.8760 * ly + 0.0416 * lz;
    const b =  0.0556 * lx - 0.2040 * ly + 1.0570 * lz;
    return [r, g, b];
}

export function RGB2XYZ(lrgb) { // from linear RGB
    const [lr, lg, lb] = lrgb;
    // linear sRGB
    const lx = 0.4124 * lr + 0.3576 * lg + 0.1805 * lb;
    const ly = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
    const lz = 0.0193 * lr + 0.1192 * lg + 0.9505 * lb;
    return [lx, ly, lz];
}

/*
 * linear RGB <=> sRGB
 * http://en.wikipedia.org/wiki/SRGB
 */
// exports.linearRGB2sRGB = linearRGB2sRGB;
export function linearRGB2sRGB(lrgb) {
    const rgb = [];
    let v;

    for (const lv of lrgb) {
        if (lv < 0.0031308) {
            v = 12.92 * lv;
        } else {
            v = 1.055 * Math.pow(lv, 1 / 2.4) - 0.055;
        }

        v *= 255;

        if (v < 0) {
            v = 0;
        } else if (v > 255) {
            v = 255;
        }

        rgb.push(v >> 0);
    }

    return rgb;
}

// exports.sRGB2linearRGB = sRGB2linearRGB;

export function sRGB2linearRGB(rgb) {
    const lrgb = [];

    for (const v of rgb) {
        let lv;

        v /= 255;

        if (v <= 0.04045) {
            lv = v / 12.92;
        } else {
            lv = Math.pow((v + 0.055) / 1.055, 2.4);
        }

        lrgb.push(lv);
    }

    return lrgb;
}

/*
 * XYZ <=> sRGB
 */
export function XYZ2sRGB(lxyz) {
    // to linear sRGB
    const rgb = XYZ2RGB(lxyz);
    // gamma correction
    return linearRGB2sRGB(rgb);
}

export function sRGB2XYZ(rgb) {
    // gamma correction
    const lrgb = sRGB2linearRGB(rgb);
    // from linear sRGB
    return RGB2XYZ(lrgb);
}

/*
 * xy <=> u'v'
 * http://www.enjoy.ne.jp/~k-ichikawa/CIEXYZ2uv.html
 */
export function xy2uava(xy) {
    const [x, y] = xy;
    const ua = 4 * x / (-2 * x + 12 * y + 3);
    const va = 9 * y / (-2 * x + 12 * y + 3);
    return [ua, va];
}

export function uava2xy(uava) {
    const [ua, va] = uava;
    const x = 9 * ua / (6 * ua - 16 * va + 12);
    const y = 4 * va / (6 * ua - 16 * va + 12);
    return [x, y];
}

/*
 * RGB <= CMYK naive convert
 */
export function RGB2CMYK(rgb) {
    const [r, g, b] = rgb;
    const k = 255 - Math.max(r, g, b);

    let c;
    let m;
    let y;

    if (k === 255) {
        [c, m, y] = [0, 0, 0];
    } else {
        c = 255 * (255 - r - k) / (255 - k);
        m = 255 * (255 - g - k) / (255 - k);
        y = 255 * (255 - b - k) / (255 - k);
    }

    return [c >> 0, m >> 0, y >> 0, k >> 0];
}

export function CMYK2RGB(cmyk) {
    const [c, m, y, k] = cmyk;
    const r = 255 - Math.min(255, c * (255 - k) / 255 + k);
    const g = 255 - Math.min(255, m * (255 - k) / 255 + k);
    const b = 255 - Math.min(255, y * (255 - k) / 255 + k);
    return [r >> 0, g >> 0, b >> 0];
}

export function RGB2CMY(rgb) {
    const [r, g, b] = rgb;
    const c = 255 - r;
    const m = 255 - g;
    const y = 255 - b;
    return [c >> 0, m >> 0, y >> 0];
}

/*
 * RGB <=> YCbCr (JPEG)
 */
export function RGB2YCbCr(rgb) {
    const [r, g, b] = rgb;
    const yy =  0.299  * r + 0.587  * g + 0.114  * b;
    let cb = -0.1687 * r - 0.3313 * g + 0.5    * b;
    let cr =  0.5    * r - 0.4187 * g - 0.0813 * b;
    cb = cb + 128;
    cr = cr + 128;
    return [yy >> 0, cb >> 0, cr >> 0];
}

export function YCbCr2RGB(ycbcr) {
    let [y, cb, cr] = ycbcr;
    cb = cb - 128;
    cr = cr - 128;
    const r = y                + 1.402   * cr;
    const g = y - 0.34414 * cb - 0.71414 * cr;
    const b = y + 1.772   * cb;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YIQ (0-255) <=> RGB
  https://en.wikipedia.org/wiki/YIQ
*/
export function RGB2YIQ(rgb) {
    const [r, g, b] = rgb;
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    let i = 0.596 * r - 0.274 * g - 0.322 * b;  b - y;
    let q = 0.211 * r - 0.523 * g + 0.312 * b;  r - y;
    i = i + 128;
    q = q + 128;
    return [y >> 0, i >> 0, q >> 0];
}

export function YIQ2RGB(yiq) {
    let [y, i, q] = yiq;
    i = i - 128;
    q = q - 128;
    const r = y + 0.956 * i + 0.621 * q;
    const g = y - 0.272 * i - 0.647 * q;
    const b = y - 1.106 * i + 1.703 * q;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YUV (PAL - SDTV BT.601) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
export function RGB2YUV_BT601(rgb) {
    const [r, g, b] = rgb;
    const y =   0.299   * r + 0.587   * g + 0.114   * b;
    let u = -0.14713 * r - 0.28886 * g + 0.436   * b;
    let v =   0.615   * r - 0.51499 * g - 0.10001 * b;
    u = u + 128;
    v = v + 128;
    return [y >> 0, u >> 0, v >> 0];
}

export function YUV2RGB_BT601(yuv) {
    let [y, u, v] = yuv;
    u = u - 128;
    v = v - 128;
    const r = y               + 1.13983 * v;
    const g = y - 0.39465 * u - 0.58060 * v;
    const b = y + 2.03211 * u;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  YUV (PAL - HDTV - BT.709) <=> RGB
  https://en.wikipedia.org/wiki/YUV
*/
export function RGB2YUV_BT709(rgb) {
    const [r, g, b] = rgb;
    const y =   0.2126  * r + 0.7152  * g + 0.0722  * b;
    let u = -0.09991 * r - 0.33609 * g + 0.436   * b;
    let v =   0.615   * r - 0.55861 * g - 0.05639 * b;
    u = u + 128;
    v = v + 128;
    return [y >> 0, u >> 0, v >> 0];
}

export function YUV2RGB_BT709(yuv) {
    let [y, u, v] = yuv;
    u = u - 128;
    v = v - 128;
    const r = y               + 1.28033 * v;
    const g = y - 0.21482 * u - 0.38059 * v;
    const b = y + 2.12798 * u;
    return [r >> 0, g >> 0, b >> 0];
}

/*
 * RGB <=> YDbDr (SECOM)
 http://mntone.hateblo.jp/entry/2017/04/01/023417
 */
export function RGB2YDbDr(rgb) {
    const [r, g, b] = rgb;
    const yy =  0.299 * r + 0.587 * g + 0.114 * b;
    let db = -0.450 * r - 0.883 * g + 1.333 * b;
    let dr = -1.333 * r + 1.116 * g + 0.217 * b;
    db = db / 2.666 + 128;
    dr = dr / 2.666 + 128;
    return [yy >> 0, db >> 0, dr >> 0];
}

/*
  http://mntone.hateblo.jp/entry/2017/04/01/023417
*/

export function YDbDr2RGB(ydbdr) {
    const y = ydbdr[0];
    let db = ydbdr[1];
    let dr = ydbdr[2];
    db = (db - 128) * 2.666;
    dr = (dr - 128) * 2.666;
    const r = y + 0.000092303716148 * db - 0.525912630661865 * dr;
    const g = y - 0.129132898890509 * db + 0.267899328207599 * dr;
    const b = y + 0.664679059978955 * db - 0.000079202543533 * dr;
    return [r >> 0, g >> 0, b >> 0];
}

/*
  HSV(360.0, 1.0, 1.0) <~> RGB
  https://en.wikipedia.org/wiki/HSL_and_HSV
*/
export function RGB2HSV(rgb) {
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const max_min = max - min;
    const v = max / 255;
    const s = (max_min) / max;

    let h;

    if ((r > g) && (r > b)) { // R max
        h = (g - b) / (max_min);

        if (h < 0) {
          h += 6;
        }
    } else if (g > b) { // G max
        h = (b - r) / (max_min) + 2;
    } else if (b > g) { // B max
        h = (r - g) / (max_min) + 4;
    } else {
        h = 0;
    }

    h = h * 60;

    return [h, s, v];
}

// http://hooktail.org/computer/index.php?RGB%A4%AB%A4%E9HSV%A4%D8%A4%CE%CA%D1%B4%B9%A4%C8%C9%FC%B8%B5
export function HSV2RGB(hsv) {
    let [h, s, v] = hsv;
    h = (h < 0) ? (h + 360) : (h % 360); // don't care for 2-loop negative.
    const h2 = (h / 60) >> 0;
    const f = h / 60 - h2;
    const m = v * (1 - s);
    const n = v * (1 - s * f);
    const k = v * (1 - s * (1 - f));

    let r;
    let g;
    let b;

    switch (h2) {
        case 0:
            [r, g, b] = [v, k, m];
            break;
        case 1:
            [r, g, b] = [n, v, m];
            break;
        case 2:
            [r, g, b] = [m, v, k];
            break;
        case 3:
            [r, g, b] = [m, n, v];
            break;
        case 4:
            [r, g, b] = [k, m, v];
            break;
        case 5:
            [r, g, b] = [v, m, n];
            break;
    }

    return [(r * 255) >> 0, (g * 255) >> 0, (b * 255) >> 0];
}

/*
 * HSL <=> RGB
 */
export function RGB2HSL(rgb) {
    const [h, s, v] = RGB2HSV(rgb);
    const l =  v * (2 - s) / 2;
    return [h, s, l];
}

export function HSL2RGB(hsl) {
    const [h, s, l] = hsl;
    const v = l * 2 / (2 - s);
    return HSV2RGB([h, s, v]);
}

/*
 * Xyb <=> RGB (Butteraugli)
 * X:red<=>green, y:yellow, b:blue
 */
export function RGB2Xyb(rgb) {
    const [r, g, b] = rgb;
    return [
        (r - g), // X
        (r + g), // y
        b  // b
    ];
}

export function Xyb2RGB(xyb) {
    const [x, y, b] = xyb;
    return [
        x + y, // r
        -x + y, // g
        b // b
   ];
}

export function normalizeRGBA_max(rgba) {
    const a = 255 / Math.max.apply(null, rgba.slice(0, 3));
    return rgba.map((v) => v * a);
}

export function normalizeRGBA_distance(rgba) {
    const [r, g, b] = rgba;
    const a = 255 / Math.sqrt(r * r + g * g + b * b);
    return rgba.map((v) => v * a);
}
