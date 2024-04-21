"use strict";

function convolveImage(imageData, kernel) {
    const { width, height } = imageData;
    imageData = convolveImageHorizontal(imageData, kernel);
    imageData = convolveImageVertical(imageData, kernel);
    return imageData;
}

function convolveImageHorizontal(imageData, kernel) {
    const { width, height } = imageData;
    const windowSize = kernel.length;
    const windowSizeHalf = (windowSize - 1) / 2;
    const data32 = new Uint32Array(imageData.data.buffer);
    const line32 = new Uint32Array(width);
    const line8 = new Uint8ClampedArray(line32.buffer);
    for (let y = 0; y < height; y++) {
        const data32 = (new Uint32Array(imageData.data.buffer)).subarray(y * width);
        const data8 = (new Uint8ClampedArray(imageData.data.buffer)).subarray(4 * y * width);
        // 畳み込み処理
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            for (let i = - windowSizeHalf; i <= windowSizeHalf; i++) {
                const w = kernel[i + windowSizeHalf];
                const _o = 4*(x + i);
                const o = (_o <= 0)? 0: ((_o < 4*width)? _o: (4*width - 4));
                r += data8[o + 0] * w;
                g += data8[o + 1] * w;
                b += data8[o + 2] * w;
                a += data8[o + 3] * w;
            }
            line8[4*x + 0] = r;
            line8[4*x + 1] = g;
            line8[4*x + 2] = b;
            line8[4*x + 3] = a;
        }
        data32.set(line32);
    }
    return imageData;
}

function convolveImageVertical(imageData, kernel) {
    imageData = transposeImage(imageData);  // 斜め反転
    convolveImageHorizontal(imageData, kernel);
    return transposeImage(imageData);  // 元に戻す
}

function transposeImage(imageData) {
    const { width, height } = imageData;
//    const dstImageData = (width === height)? imageData:
//          (new ImageData(height, width));
    const dstImageData = new ImageData(height, width);
    const srcData32 = new Uint32Array(imageData.data.buffer);
    const dstData32 = new Uint32Array(dstImageData.data.buffer);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = x + y * width;
            const dstOffset = y + x * height;
            const v = srcData32[offset];
            srcData32[offset] = dstData32[dstOffset];
            dstData32[dstOffset] = v;
        }
    }
    return dstImageData;
}
