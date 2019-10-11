/*
 * 2017/06/10- (c) yoya@awm.jp
 * 2018/02/20- (c) yoya@awm.jp from ../cie.js
 */

export const tristimulus_XYs_Table = {
    // http://flat-display-2.livedoor.biz/archives/50594042.html
    // https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space
    srgb:     [[0.640, 0.330], [0.300, 0.600], [0.150, 0.060]],
    dcip3:    [[0.680, 0.320], [0.265, 0.690], [0.150, 0.060]],
    adobe:    [[0.640, 0.330], [0.210, 0.710], [0.150, 0.060]],
    prophoto: [[0.7347, 0.2653], [0.1596, 0.8404], [0.0366, 0.0001]],
    bt2020:   [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]]
};

export function loadCIEXYZdata(callback) {
    const cieDefault = 'cie31Arr'; // cieSelect as default
    const cieTable = {
        cie31Arr: 'data/ciexyz31.json',
        cie64Arr: 'data/ciexyz64.json',
        cieJVArr: 'data/ciexyzjv.json'
    };

    for (const cie in cieTable) {
        const file = cieTable[cie];
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                const cie = xhr.cie;
                let arr = JSON.parse(xhr.responseText);

                arr = arr.filter((e) => {
                    const lw =  e[0]; // length of wave
                    return (lw > 370) && (lw < 720);
                });

                if (cie == cieDefault) {
                    callback(cie, arr, true);
                } else {
                    callback(cie, arr, false);
                }
            }
        };

        xhr.cie = cie;
        xhr.open('GET', file, true); // async:true
        xhr.send(null);
    }
}

export function loadCIE10ind_data(callback) {
    const file = 'data/SB10_corrected_indiv_CMFs.json';
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
        if (this.readyState === 4) {
            const arr = JSON.parse(xhr.responseText);
            callback(arr);
        }
    };

    xhr.open('GET', file, true); // async:true
    xhr.send(null);
    xhr = null;
};

export function drawSpectrumGraph(canvas, params) {
    canvas.width = canvas.width; // clear
    drawSpectrumGraphBase(canvas, params);

    if (params.guide) {
        drawSpectrumGraphAxis(canvas, params);
    }

    drawSpectrumGraphCMF(canvas, params);
}

export function graphTrans(xy, width, height) {
    const [x, y] = xy;
    return [x * width, (1 - y) * height];
}

export function graphTransRev(xy, width, height) {
    const [x, y] = xy;
    return [x / width, 1 - (y / height)];
}

function drawDiagramBase(dstCanvas, params) {
    const cieArr       = params.cieArr;
    const chromaticity = params.chromaticity;
    const colorspace   = params.colorspace;
    const tristimulus  = params.tristimulus;
    const guide        = params.guide;
    const caption      = params.caption;
    const normalize    = params.normalize;
    dstCanvas.width = dstCanvas.width;
    const xyArr = []; const rgbArr = [];

    for (let i = 0, n = cieArr.length; i < n; i++) {
        const data = cieArr[i];
        const [wl, lx, ly, lz] = data;
        lxyz = [lx, ly, lz];
        const xy = XYZ2xy(lxyz);
        const rgb = XYZ2sRGB(lxyz);

        if (chromaticity === 'ciexy') {
            xyArr.push(xy);
        } else {
            const uava = xy2uava(xy);
            xyArr.push(uava);
        }

        rgbArr.push(rgb);
    }

    // drawing
    const width = dstCanvas.width; const height = dstCanvas.height;
    const ctx = dstCanvas.getContext('2d');
    ctx.save();

    if (guide) { // draw axis
        for (let x = 0; x <= 10; x++) {
            const [x1, y1] = graphTrans([x / 10, 0], width, height);
            const [x2, y2] = graphTrans([x / 10, 1], width, height);
            ctx.beginPath();

            if (x % 5 === 0) {
                ctx.strokeStyle = 'lightgray';
            } else {
                ctx.strokeStyle = 'gray';
            }

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        for (let y = 0; y <= 10; y++) {
            const [x1, y1] = graphTrans([0, y / 10], width, height);
            const [x2, y2] = graphTrans([1, y / 10], width, height);
            ctx.beginPath();

           if (y % 5 === 0) {
               ctx.strokeStyle = 'lightgray';
           } else {
               ctx.strokeStyle = 'gray';
           }

           ctx.moveTo(x1, y1);
           ctx.lineTo(x2, y2);
           ctx.stroke();
       }
    }

    // geometry mapping
    const gxyArr = [];

    for (const i in xyArr) {
        gxyArr.push(graphTrans(xyArr[i], width, height));
    }

    const cxyArr = xyArr2CntlArr(gxyArr);

    ctx.save(); // spectrum color filling begin
    // clip definition
    ctx.beginPath();

    for (let i = 0, n = gxyArr.length; i < n; i++) {
        const [gx, gy] = gxyArr[i];
        const [cx, cy] = cxyArr[i];
        const [r, g, b] = rgbArr[i];
        ctx.strokeStyle = `rgb(${r},${g},${b})`;

        if (i >= gxyArr.length - 1) {
            ctx.lineTo(gx, gy);
        } else {
            ctx.quadraticCurveTo(cx, cy, gx, gy);
        }

        // console.debug(cx, cy, gx, gy);
    }

    ctx.closePath();
    ctx.clip();

    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d');
    offCanvas.width = width; offCanvas.height = height;
    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;
    let offset = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const xy = graphTransRev([x, y], width, height);

            let lxyz;

            if (chromaticity === 'ciexy') {
                lxyz = xy2XYZ(xy);
            } else {
                xy = uava2xy(xy);
                lxyz = xy2XYZ(xy);
            }

            const rgb = XYZ2sRGB(lxyz);
            let r;
            let g;
            let b;

            if (normalize === 'distance') {
                [r, g, b] = normalizeRGBA_distance(rgb);
            } else {
                [r, g, b] = normalizeRGBA_max(rgb);
            }

            data[offset++] = r;
            data[offset++] = g;
            data[offset++] = b;
            data[offset++] = 255;
        }
    }

    offCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(offCanvas, 0, 0, width, height);
    ctx.restore(); // spectrum color filling end

    if (tristimulus) {
        // ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        let tristimulus_XYs;

        if (Array.isArray(tristimulus)) {
            tristimulus_XYs = tristimulus;
        } else {
            tristimulus_XYs = tristimulus_XYs_Table[colorspace];
        }

        for (const i in tristimulus_XYs) {
            const xy = tristimulus_XYs[i];

            if (chromaticity !== 'ciexy') {
                xy = xy2uava(xy);
            }

            const [gx, gy] = graphTrans(xy, width, height);

            if (i === 0) {
                ctx.moveTo(gx, gy);
            } else {
                ctx.lineTo(gx, gy);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();

    if (caption) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.fillText(caption, width / 2, 0);
    }
}

export function drawDiagramPoints(canvas, params) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const drawPoints = params.drawPoints;

    if (drawPoints) {
        for (const i in drawPoints) {
            const point = drawPoints[i];
            const stroke = point.stroke;
            const fill = point.fill;
            const xy = point.xy;
            ctx.beginPath();
            ctx.strokeStyle = stroke;
            ctx.fillStyle = fill;
            ctx.lineWidth = 0.5;
            const [gx, gy] = graphTrans(xy, width, height);
            ctx.arc(gx, gy, 6, 0, 2 * Math.PI, false);
            ctx.stroke();
            ctx.fill();
        }
    }
}

export function drawSpectrumGraphBase(canvas, params) {
    const cieArr = params.cieArr;
    const guide = params.guide;
    const xMax = params.xMax;
    const xMin = params.xMin;
    canvas.style.backgroundColor = 'black';
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const arrLen = cieArr.length;
    const xyRatioTable = [];
    const grad = ctx.createLinearGradient(0, 0, width, 0);

    // spectrum gradient
    for (const i in cieArr) {
        const [wl, lx, ly, lz] = cieArr[i];

        let x;
        let y;
        let z;
        let a;

        if (wl <= 445) {
            // wl: 445
            [x, y, z] = [0.348060000000, 0.029800000000, 1.782600000000];
            a = lz / 1.782600000000 / 2;
        } else if (wl < 605) {
            [x, y, z] = [lx, ly, lz];
            // var a = 1.0;
            a = 1.0 / 2;
        } else {
            // wl: 605
            [x, y, z] = [1.045600000000, 0.566800000000, 0.000600000000];
            a = lx / 1.045600000000 / 2;
        }

        const lrgb = XYZ2RGB([x, y, z]);
        const [r, g, b] = linearRGB2sRGB(lrgb);
        let stop = (wl - xMin) / (xMax - xMin);
        stop = Utils.Clamp(stop, 0, 1.0);
        const color = `rgba(${r},${g},${b},${a})`;
        grad.addColorStop(stop, color);
    }

    ctx.fillStyle = grad;
    ctx.rect(0, 0, width, height);
    ctx.fill();
}

export function drawSpectrumGraphAxis(canvas, params) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const xMax = params.xMax;
    const xMin = params.xMin;
    const yMax = params.yMax;
    const yMin = params.yMin;
    // var x = width * (wlArr[j] - xMin) / (xMax-xMin);
    // var y = height * (1 - (arr[j]-yMin) / (yMax-yMin));
    const y0 = height * (1 - (0 - yMin) / (yMax - yMin));

    for (let wl = 400;  wl < 700; wl += 50) {
        const x = width * (wl - xMin) / (xMax - xMin);

        if ((wl % 50) === 0) {
            ctx.beginPath();

            if ((wl % 100) === 0) {
                ctx.strokeStyle = 'rgb(192,192,192)';
                ctx.strokeText(wl + 'nm', x, y0 + 12);
            } else {
                ctx.strokeStyle = 'rgba(172,172,172, 0.5)';
            }

            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    for (let v = -3;  v <= 5; v += 1) {
        ctx.beginPath();
        const y = height * (1 - (v - yMin) / (yMax - yMin));

        if (v === 0) {
            console.log(v);
            ctx.strokeStyle = 'rgb(192,192,192)';
        } else {
            ctx.strokeStyle = 'rgba(172,172,172, 0.5)';
        }

        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

function drawSpectrumGraphCMF(canvas, params) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const cieArr = params.cieArr;
    const arrLen = cieArr.length;
    const wlArr = new Float32Array(arrLen);
    const lxArr = new Float32Array(arrLen);
    const lyArr = new Float32Array(arrLen);
    const lzArr = new Float32Array(arrLen);

    // color matching function
    for (const i in cieArr) {
        const [wl, lx, ly, lz] = cieArr[i];
        wlArr[i] = wl;
        lxArr[i] = lx;
        lyArr[i] = ly;
        lzArr[i] = lz;
    }

    const xMax = params.xMax;
    const xMin = params.xMin;
    let yMax = params.yMax;
    let yMin = params.yMin;

    if (xMax === undefined) {
        yMax = Math.max(wlArr);
    }

    if (xMin === undefined) {
        yMax = Math.min(wlArr);
    }

    if (yMax === undefined) {
        const lxMax = Math.max.apply(null, lxArr);
        const lyMax = Math.max.apply(null, lyArr);
        const lzMax = Math.max.apply(null, lzArr);
        yMax = Math.max(lxMax, lyMax, lzMax);
    }

    if (yMin === undefined) {
        const lxMin = Math.min.apply(null, lxArr);
        const lyMin = Math.min.apply(null, lyArr);
        const lzMin = Math.min.apply(null, lzArr);
        yMin = Math.min(lxMin, lyMin, lzMin);
    }

    const graphLines = [
        ['#F66', lxArr],
        ['#2D2', lyArr],
        ['#48F', lzArr]
    ];

    // ctx.globalCompositeOperation = "lighter";

    for (const i in graphLines) {
        const [color, arr] = graphLines[i];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let j = 0, n = arr.length; j < n; j++) {
            const x = width * (wlArr[j] - xMin) / (xMax - xMin);
            const y = height * (1 - (arr[j] - yMin) / (yMax - yMin));

            if (j === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }
}
