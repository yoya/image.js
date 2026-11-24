"use strict";
/*
 * 2026/11/24- (c) yoya@awm.jp
 *
 * FFT (任意サイズ)
 *  - 2^n: radix-2 (反復・回転因子テーブル)
 *  - それ以外: Bluestein (chirp-z) で 2^n の FFT に帰着
 * 正変換: X[k] = Σ x[n] exp(-2πi nk/N)  (スケールなし)
 * 逆変換: 1/N でスケール
 */

function isPow2(n) {
    return (n > 0) && ((n & (n - 1)) === 0);
}

function nextPow2(n) {
    let m = 1;
    while (m < n) {
        m <<= 1;
    }
    return m;
}

// 2^n サイズの in-place 複素 FFT 用テーブル
class FFTRadix2 {
    constructor(n) {
        if (! isPow2(n)) {
            throw new Error("FFTRadix2: n must be 2^k: "+n);
        }
        this.n = n;
        const bits = Math.round(Math.log2(n));
        const rev = new Uint32Array(n);
        for (let i = 0; i < n; i++) {
            let r = 0, x = i;
            for (let b = 0; b < bits; b++) {
                r = (r << 1) | (x & 1);
                x >>= 1;
            }
            rev[i] = r;
        }
        const half = n >> 1;
        const cos = new Float64Array(half);
        const sin = new Float64Array(half);
        for (let k = 0; k < half; k++) {
            const a = 2 * Math.PI * k / n;
            cos[k] = Math.cos(a);
            sin[k] = Math.sin(a);
        }
        this.rev = rev;
        this.cos = cos;
        this.sin = sin;
    }
    // re/im の [off, off+n) を変換する (スケールなし)
    transform(re, im, off, inverse) {
        const n = this.n, rev = this.rev, C = this.cos, S = this.sin;
        const sign = inverse ? 1 : -1;
        for (let i = 0; i < n; i++) {
            const j = rev[i];
            if (i < j) {
                const a = off + i, b = off + j;
                let t = re[a]; re[a] = re[b]; re[b] = t;
                t = im[a]; im[a] = im[b]; im[b] = t;
            }
        }
        for (let size = 2; size <= n; size <<= 1) {
            const h = size >> 1, step = n / size;
            for (let s = 0; s < n; s += size) {
                for (let j = 0, k = 0; j < h; j++, k += step) {
                    const a = off + s + j, b = a + h;
                    const wr = C[k], wi = sign * S[k];
                    const br = re[b], bi = im[b];
                    const xr = wr * br - wi * bi;
                    const xi = wr * bi + wi * br;
                    re[b] = re[a] - xr; im[b] = im[a] - xi;
                    re[a] += xr;        im[a] += xi;
                }
            }
        }
    }
    // 行列 (幅 width) の列方向を一括変換する。
    // 行どうしのバタフライにして、要素を飛び飛びに読まない。
    transformColumns(re, im, width, inverse) {
        const n = this.n, rev = this.rev, C = this.cos, S = this.sin;
        const sign = inverse ? 1 : -1;
        for (let i = 0; i < n; i++) {
            const j = rev[i];
            if (i < j) {
                const a = i * width, b = j * width;
                for (let x = 0; x < width; x++) {
                    let t = re[a + x]; re[a + x] = re[b + x]; re[b + x] = t;
                    t = im[a + x]; im[a + x] = im[b + x]; im[b + x] = t;
                }
            }
        }
        for (let size = 2; size <= n; size <<= 1) {
            const h = size >> 1, step = n / size;
            for (let s = 0; s < n; s += size) {
                for (let j = 0, k = 0; j < h; j++, k += step) {
                    const a = (s + j) * width, b = (s + j + h) * width;
                    const wr = C[k], wi = sign * S[k];
                    for (let x = 0; x < width; x++) {
                        const br = re[b + x], bi = im[b + x];
                        const xr = wr * br - wi * bi;
                        const xi = wr * bi + wi * br;
                        re[b + x] = re[a + x] - xr; im[b + x] = im[a + x] - xi;
                        re[a + x] += xr;            im[a + x] += xi;
                    }
                }
            }
        }
    }
}

// 任意サイズの 1D 複素 FFT
class FFT1D {
    constructor(n) {
        if (! (Number.isInteger(n) && n >= 1)) {
            throw new Error("FFT1D: invalid size: "+n);
        }
        this.n = n;
        if (isPow2(n)) {
            this.radix2 = new FFTRadix2(n);
            return ;
        }
        // Bluestein: nk = (n^2 + k^2 - (k-n)^2) / 2
        const m = nextPow2(2 * n - 1);
        const n2 = 2 * n;
        const wr = new Float64Array(n), wi = new Float64Array(n);
        for (let j = 0; j < n; j++) {
            // j^2 mod 2n を整数で求めて角度の精度落ちを防ぐ
            const a = Math.PI * ((j * j) % n2) / n;
            wr[j] = Math.cos(a);
            wi[j] = -Math.sin(a); // w[j] = exp(-πi j^2/n)
        }
        const br = new Float64Array(m), bi = new Float64Array(m);
        br[0] = wr[0]; bi[0] = -wi[0];
        for (let j = 1; j < n; j++) {
            br[j] = br[m - j] = wr[j];   // conj(w[j])
            bi[j] = bi[m - j] = -wi[j];
        }
        this.inner = new FFTRadix2(m);
        this.inner.transform(br, bi, 0, false);
        this.m = m;
        this.wr = wr; this.wi = wi;
        this.br = br; this.bi = bi;
        this.ar = new Float64Array(m);
        this.ai = new Float64Array(m);
    }
    // re/im の [off, off+n) を変換する (スケールなし)
    transform(re, im, off, inverse) {
        if (this.radix2) {
            this.radix2.transform(re, im, off, inverse);
            return ;
        }
        const n = this.n, m = this.m;
        const wr = this.wr, wi = this.wi, br = this.br, bi = this.bi;
        const ar = this.ar, ai = this.ai;
        // 逆変換は conj(FFT(conj(x)))
        const s = inverse ? -1 : 1;
        for (let j = 0; j < n; j++) {
            const xr = re[off + j], xi = s * im[off + j];
            ar[j] = xr * wr[j] - xi * wi[j];
            ai[j] = xr * wi[j] + xi * wr[j];
        }
        ar.fill(0, n); ai.fill(0, n);
        this.inner.transform(ar, ai, 0, false);
        for (let j = 0; j < m; j++) {
            const xr = ar[j], xi = ai[j];
            ar[j] = xr * br[j] - xi * bi[j];
            ai[j] = xr * bi[j] + xi * br[j];
        }
        this.inner.transform(ar, ai, 0, true);
        const im_ = 1 / m;
        for (let k = 0; k < n; k++) {
            const xr = ar[k] * im_, xi = ai[k] * im_;
            re[off + k] = xr * wr[k] - xi * wi[k];
            im[off + k] = s * (xr * wi[k] + xi * wr[k]);
        }
    }
    forward(re, im) {
        this.transform(re, im, 0, false);
    }
    inverse(re, im) {
        this.transform(re, im, 0, true);
        const n = this.n, s = 1 / n;
        for (let i = 0; i < n; i++) {
            re[i] *= s; im[i] *= s;
        }
    }
}

// 任意サイズ (width x height) の 2D 複素 FFT。データは行優先 (index = x + y*width)
class FFT2D {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.row = new FFT1D(width);
        this.col = new FFT1D(height);
    }
    _transform(re, im, inverse) {
        const w = this.width, h = this.height;
        if (re.length < w * h || im.length < w * h) {
            throw new Error("FFT2D: array too short");
        }
        for (let y = 0; y < h; y++) {
            this.row.transform(re, im, y * w, inverse);
        }
        if (this.col.radix2) {
            this.col.radix2.transformColumns(re, im, w, inverse);
        } else {
            const tr = new Float64Array(h), ti = new Float64Array(h);
            for (let x = 0; x < w; x++) {
                for (let y = 0, i = x; y < h; y++, i += w) {
                    tr[y] = re[i]; ti[y] = im[i];
                }
                this.col.transform(tr, ti, 0, inverse);
                for (let y = 0, i = x; y < h; y++, i += w) {
                    re[i] = tr[y]; im[i] = ti[y];
                }
            }
        }
    }
    forward(re, im) {
        this._transform(re, im, false);
    }
    inverse(re, im) {
        this._transform(re, im, true);
        const n = this.width * this.height, s = 1 / n;
        for (let i = 0; i < n; i++) {
            re[i] *= s; im[i] *= s;
        }
    }
    // 実数データ 2 つを 1 回の複素 FFT で変換する。
    // z = a + ib, A[k] = (Z[k] + conj(Z[-k]))/2, B[k] = (Z[k] - conj(Z[-k]))/2i
    forwardReal2(a, b) {
        const w = this.width, h = this.height, n = w * h;
        const zr = Float64Array.from(a), zi = Float64Array.from(b);
        this.forward(zr, zi);
        const ar = new Float64Array(n), ai = new Float64Array(n);
        const br = new Float64Array(n), bi = new Float64Array(n);
        for (let y = 0; y < h; y++) {
            const my = (h - y) % h;
            for (let x = 0; x < w; x++) {
                const i = x + y * w, j = (w - x) % w + my * w;
                const pr = zr[i], pi = zi[i], qr = zr[j], qi = -zi[j];
                ar[i] = (pr + qr) / 2; ai[i] = (pi + qi) / 2;
                br[i] = (pi - qi) / 2; bi[i] = (qr - pr) / 2;
            }
        }
        return [[ar, ai], [br, bi]];
    }
    // 2 つのスペクトルを 1 回の複素 IFFT で戻し、それぞれの実部を返す。
    // Re(IFFT(A)) = IFFT((A[k] + conj(A[-k]))/2) なので、エルミート対称化してから詰める。
    inverseReal2(ar, ai, br, bi) {
        const w = this.width, h = this.height, n = w * h;
        const zr = new Float64Array(n), zi = new Float64Array(n);
        for (let y = 0; y < h; y++) {
            const my = (h - y) % h;
            for (let x = 0; x < w; x++) {
                const i = x + y * w, j = (w - x) % w + my * w;
                const hr = (ar[i] + ar[j]) / 2, hi = (ai[i] - ai[j]) / 2;
                const gr = (br[i] + br[j]) / 2, gi = (bi[i] - bi[j]) / 2;
                zr[i] = hr - gi; zi[i] = hi + gr;
            }
        }
        this.inverse(zr, zi);
        return [zr, zi];
    }
    // 直流成分を (floor(w/2), floor(h/2)) に移す (奇数サイズ対応)
    static shift(data, width, height) {
        FFT2D._roll(data, width, height, width >> 1, height >> 1);
    }
    // shift の逆
    static unshift(data, width, height) {
        FFT2D._roll(data, width, height, width - (width >> 1), height - (height >> 1));
    }
    static _roll(data, width, height, dx, dy) {
        const tmp = data.slice(0, width * height);
        for (let y = 0; y < height; y++) {
            const oy = ((y + dy) % height) * width;
            for (let x = 0; x < width; x++) {
                data[(x + dx) % width + oy] = tmp[x + y * width];
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { FFT1D, FFT2D };
}
