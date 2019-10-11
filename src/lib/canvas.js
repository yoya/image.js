/*
 * 2017/03/16- (c) yoya@awm.jp
 */

export function clamp(x, min, max) {
    if (min < x) {
        return (x < max) ? x : max;
    }

    return min;
}

export function drawSrcImage(srcImage, dstCanvas, maxWidthHeight) {
    // console.debug("drawSrcImage");
    const dstCtx = dstCanvas.getContext('2d');
    let width = srcImage.width;
    let height = srcImage.height;

    if ((maxWidthHeight < width) || (maxWidthHeight < height)) {
        const resizeScale = maxWidthHeight / ((width > height) ? width : height);
        width  *= resizeScale;
        height *= resizeScale;
    }

    dstCanvas.width  = width;
    dstCanvas.height = height;

    dstCtx.drawImage(
        srcImage,
        0,
        0,
        srcImage.width,
        srcImage.height,
        0,
        0,
        width,
        height
    );
}

export function copyCanvas(srcCanvas, dstCanvas) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const width = srcCanvas.width;
    const height = srcCanvas.height;
    dstCanvas.width = width; dstCanvas.height = height;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    dstCtx.putImageData(srcImageData, 0, 0);
}

export function createImageDataFloat32(width, height) {
    return {
        width,
        height,
        data: new Float32Array(4 * width * height)
    };
}

export function copyImageData(src, dst) {
    const srcStride = 4 * src.width;
    const dstStride = 4 * dst.width;
    const width = Math.min(src.width, dst.width);
    const width_4 = width * 4;
    const height = Math.min(src.height, dst.height);

    for (let y = 0; y < height; y++) {
        const srxOffset = srcStride * y;
        let dstOffset = dstStride * y;

        for (let x = 0; x < width_4; x++) {
            dst.data[dstOffset++] = src.data[srcOffset++];
        }
    }
}

export function overlayImageData(src, dst, srcX = 0, srcY = 0, dstX = 0, dstY = 0) {
    const srcStride = 4 * src.width;
    const dstStride = 4 * dst.width;
    const width  = Math.min(src.width - srcX, dst.width - dstX);
    const height = Math.min(src.height - srcY, dst.height - dstY);
    const srcOffsetBase = 4 * srcX + srcY * srcStride;
    const dstOffsetBase = 4 * dstX + dstY * dstStride;

    for (let y = 0; y < height; y++) {
        let srcOffset = srcOffsetBase + srcStride * y;
        let dstOffset = dstOffsetBase + dstStride * y;

        for (let x = 0; x < width; x++) {
            const alpha = src.data[srcOffset + 3];

            if (alpha === 0) {
                dstOffset += 4;
                srcOffset += 4;
            } else if (alpha < 255) {
                const a1 = (255 - alpha) / 255;
                const a2 = alpha / 255;
                dst.data[dstOffset] = a1 * dst.data[dstOffset] + a2 * src.data[srcOffset++];
                dstOffset++;
                dst.data[dstOffset] = a1 * dst.data[dstOffset] + a2 * src.data[srcOffset++];
                dstOffset++;
                dst.data[dstOffset] = a1 * dst.data[dstOffset] + a2 * src.data[srcOffset++];
                dstOffset++;
                dst.data[dstOffset] = a1 * dst.data[dstOffset] + a2 * src.data[srcOffset++]; // XXX
                dstOffset++;
            } else {
                dst.data[dstOffset++] = src.data[srcOffset++];
                dst.data[dstOffset++] = src.data[srcOffset++];
                dst.data[dstOffset++] = src.data[srcOffset++];
                dst.data[dstOffset++] = src.data[srcOffset++];
            }
        }
    }
}

export function drawGrayImage(srcCanvas, dstCanvas) {
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const width = srcCanvas.width;
    const height = srcCanvas.height;
    dstCanvas.width  = width;
    dstCanvas.height = height;
    const srcImageData = srcCtx.getImageData(0, 0, width, height);
    const dstImageData = dstCtx.createImageData(width, height);
    const gamma = 2.2;
    const gamma_re = 1 / 2.2; // reciprocal

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = getRGBA(srcImageData, x, y);
            const lr = Math.pow(r / 255, gamma);
            const lg = Math.pow(g / 255, gamma);
            const lb = Math.pow(b / 255, gamma);
            const lv = 0.2126  * lr + 0.7152  * lg + 0.0722  * lb;
            const v = (Math.pow(lv, gamma_re) * 255) | 0;
            const rgba = [v, v, v, a];
            setRGBA(dstImageData, x, y, rgba);
       }
    }

    dstCtx.putImageData(dstImageData, 0, 0);
}

/*
 * out-side fill style
 */
const OUTFILL_TRANSPARENT = 1; // transparent fill
const OUTFILL_EDGE        = 2; // edge extend fill
const OUTFILL_TILE        = 3; // tiled repeat fill
const OUTFILL_MIRROR      = 4; // mirror tiled repeat fill
const OUTFILL_WHITE       = 5; // white fill
const OUTFILL_BLACK       = 6; // black fill

export function outfillStyleNumber(name) {
    switch (name) { // out-side fill style
        case 'transparent':
            return OUTFILL_TRANSPARENT;
        case 'edge':
            return OUTFILL_EDGE;
        case 'tile':
            return OUTFILL_TILE;
        case 'mirror':
            return OUTFILL_MIRROR;
        case 'white':
            return OUTFILL_WHITE;
        case 'black':
            return OUTFILL_BLACK;
    }

    console.warn('unknown outfill style:' + name);

    return OUTFILL_TRANSPARENT;
}

export function getRGBA(imageData, x, y, outfill) {
    const width = imageData.width;
    const height = imageData.height;

    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
         switch (outfill) { // out-side fill style
             case OUTFILL_TRANSPARENT:
                 return [0, 0, 0, 0];
             case OUTFILL_EDGE:
                 x = clamp(x, 0, width - 1);
                 y = clamp(y, 0, height - 1);
                 break;
             case OUTFILL_TILE:
                 x %= width;
                 y %= height;
                 break;
             case OUTFILL_MIRROR:
                 if (x < 0) {
                     x = -x;
                 }

                 if (y < 0) {
                     y = -y;
                 }

                 const xn = (x / width) >> 0;
                 const yn = (y / height) >> 0;
                 x %= width;
                 y %= height;

                 if (xn % 2) {
                     x = width - x - 1;
                 }

                 if (yn % 2) {
                     y = height - y - 1;
                 }

                 break;
             case OUTFILL_WHITE:
                 return [255, 255, 255, 255];
             case OUTFILL_BLACK:
                 return [0, 0, 0, 255];
         }
    }

    const offset = 4 * (x + y * width);

    return imageData.data.slice(offset, offset + 4);
}

export function setRGBA(imageData, x, y, rgba) {
    const width = imageData.width;
    const height = imageData.height;

    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
        return; // nothing to do
    }

    const data = imageData.data;
    let offset = 4 * (x + y * imageData.width);
    data[offset++] = rgba[0];
    data[offset++] = rgba[1];
    data[offset++] = rgba[2];
    data[offset++] = rgba[3];
}

export function addRGBA(imageData, x, y, rgba) {
    const width = imageData.width;
    const height = imageData.height;

    if ((x < 0) || (width <= x) || (y < 0) || (height <= y)) {
        return; // nothing to do
    }

    const data = imageData.data;
    let offset = 4 * (x + y * imageData.width);
    data[offset++] += rgba[0];
    data[offset++] += rgba[1];
    data[offset++] += rgba[2];
    data[offset++] += rgba[3];
}

export function getLuma(imageData, x, y) {
    const rgba = getRGBA(imageData, x, y);
    return lumaFromRGBA(rgba);
}

export function getColorNum(imageData) {
    const width = imageData.width;
    const height = imageData.height;

    if ('getContext' in imageData) { // canvas fallback
        const ctx = imageData.getContext('2d');
        imageData = ctx.getImageData(0, 0, width, height);
    }

    const data = imageData.data;
    const colorMap = {};

    for (let i = 0, n = data.length; i < n; i += 4) {
        const colorId = RGBA2colorId(data.slice(i, i + 4));
        colorMap[colorId] = true;
    }

    return Object.keys(colorMap).length;
}

export function RGBA2colorId(rgba) {
    const [r, g, b, a] = rgba;
    const colorId = (((((r * 0x100) + g) * 0x100) + b) * 0x100) + a;
    return colorId;
}

export function colorId2RGBA(colorId) {
    const r = (colorId >> 24) & 0xff;
    const g = (colorId >> 16) & 0xff;
    const b = (colorId >> 8) & 0xff;
    const a = (colorId >> 0) & 0xff;
    return [r, g, b, a];
}

function getColorHistogram(imageData) {
    const width = imageData.width;
    const height = imageData.height;

    if ('getContext' in imageData) { // canvas fallback
        const ctx = imageData.getContext('2d');
        imageData = ctx.getImageData(0, 0, width, height);
    }

    const data = imageData.data;
    const colorHist = {};

    for (let i = 0, n = data.length; i < n; i += 4) {
        const colorId = RGBA2colorId(data.slice(i, i + 4));

        if (colorId in colorHist) {
            colorHist[colorId] += 1;
        } else {
            colorHist[colorId] = 1;
        }
    }

    return colorHist;
}

export function getColorHistogramList(imageData, component) {
    const width = imageData.width;
    const height = imageData.height;

    if ('getContext' in imageData) { // canvas fallback
        const ctx = imageData.getContext('2d');
        imageData = ctx.getImageData(0, 0, width, height);
    }

    const data = imageData.data;
    const colorHist = new Uint32Array(256);
    const offset = { red: 0, green: 1, blue: 2 }[component];

    for (let i = 0, n = data.length; i < n; i += 4) {
         const v = data[i + offset];
         colorHist[v] += 1;
    }

    return colorHist;
}

export function getColorIdDistance_nosqrt(colorId1, colorId2) {
    const [r1, g1, b1, a1] = colorId2RGBA(colorId1);
    const [r2, g2, b2, a2] = colorId2RGBA(colorId2);
    let r_diff = r1 - r2; r_diff *= 3;
    let g_diff = g1 - g2; g_diff *= 5;
    const b_diff = b1 - b2; // b_diff *= 1;
    // var a_diff = a1 - a2;
    return r_diff * r_diff + g_diff * g_diff + b_diff * b_diff; // + a_diff*a_diff;
}

export function drawPalette(canvas, palette) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    canvas.width = width; canvas.height = height;
    const dx = width  / 0x10;
    const dy = height / 0x10;

    for (let i = 0, n = palette.length; i < n; i++) {
        const x = (i % 0x10) * dx;
        const y = Math.floor(i / 0x10) * dy;
        const [r, g, b, a] = colorId2RGBA(palette[i]);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, dx - 1, dy - 1);
        ctx.fill();
    }
}

export function xyArr2CntlArr(xyArr) {
    const n = xyArr.length;
    const arr  = xyArr.slice(-2).concat(xyArr).concat([xyArr[0]]);
    const cntlArr = [];

    for (let i = 0; i < n; i++) {
        const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = arr.slice(i, i + 4);
        const cx1 = x2 + (x2 - x1) / 4;
        const cy1 = y2 + (y2 - y1) / 4;
        const cx2 = x3 + (x3 - x4) / 4;
        const cy2 = y3 + (y3 - y4) / 4;
        cntlArr.push([(cx1 + cx2) / 2, (cy1 + cy2) / 2]);
    }

    return cntlArr;
}

export function drawHistgramGraph(
    histCanvas,
    redHist,
    greenHist,
    blueHist,
    minValue,
    maxValue,
    totalLine,
    histogram) {
    const height = histCanvas.height;
    histCanvas.style.backgroundColor = 'black';
    histCanvas.height = height; // canvas clear
    const ctx = histCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, histCanvas.width, histCanvas.height);
    ctx.globalCompositeOperation = 'lighter';
    const redCount = redHist.reduce((prev, cur) => prev + cur);
    const greenCount = redHist.reduce((prev, cur) => prev + cur);
    const blueCount = redHist.reduce((prev, cur) => prev + cur);
    const processList = [
        ['#F00', '#855', redHist, redCount],
        ['#0F0', '#585', greenHist, greenCount],
        ['#00F', '#558', blueHist, blueCount]
    ];
    let max = 0;

    for (let i = 0; i < processList.length; i++) {
        const [color, color2, hist]  =  processList[i];

        for (let j = 0; j < 256; j++) {
            const v = hist[j];

            if (max < v) {
                max = v;
            }
        }
    }

    for (let i = 0; i < processList.length; i++) {
        const [color, color2, hist, nColor]  =  processList[i];
        ctx.strokeStyle = color2;
        // total line
        if (totalLine) {
            ctx.beginPath();
            ctx.moveTo(0 + 0.5, height);
            let total = 0;

            for (let x = 0; x < 256; x++) {
                total += hist[x];
                const y = height  - height * total / nColor;
                // . console.log(hist[x], total, y);
                ctx.lineTo(x + 0.5, y + 0.5);
            }

            ctx.stroke();
        }

        ctx.strokeStyle = color;

        // histogram bar
        if (histogram) {
            for (let x = 0; x < 256; x++) {
                const nColor = hist[x];
                const y = height - (nColor * height / max) - 1;
                ctx.beginPath();
                ctx.moveTo(x + 0.5, height);
                ctx.lineTo(x + 0.5, y + 0.5);
                ctx.stroke();
            }
        }
    }

    // out of range
    ctx.fillStyle = 'gray';

    if (minValue > 0) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.rect(0, 0, minValue, height);
        ctx.fill();
    }

    if (maxValue < 255) {
        ctx.beginPath();
        ctx.moveTo(maxValue + 1, 0);
        ctx.rect(maxValue + 1, 0, 256, height);
        ctx.fill();
    }
}
