"use strict";
/*
 * 2017/03/17- (c) yoya@awm.jp : algorithm
 * 2017/06/25- (c) yoya@awm.jp : worker
 * 2026/11/10- linearCut, medianCut, populationEqualization, kMeans
 */

importScripts("../lib/canvas.js");

onmessage = function(e) {
    var [srcImageData, quantizeMethod] = [e.data.image, e.data.method];
    var srcWidth = srcImageData.width;
    var srcHeight = srcImageData.height;
    var dstImageData = new ImageData(srcWidth, srcHeight);
    drawColorReduction(srcImageData, dstImageData, quantizeMethod);
    //
    var paletteHist = getColorHistogram(dstImageData);
    var paletteNum = Object.keys(paletteHist).length;
    var palette = new Uint32Array(paletteNum);
    var i = 0;
    for (var colorId in paletteHist) {
	colorId = parseFloat(colorId);
	palette[i] = colorId;
	i++;
    }
    postMessage({image:dstImageData, palette:palette},
		[dstImageData.data.buffer]);
}

function drawColorReduction(srcImageData, dstImageData, quantizeMethod) {
    switch (quantizeMethod) {
    case "uniform": // 均等量子化法
	drawColorReduction_uniform(srcImageData, dstImageData);
	break;
    case "popularity": // 頻度法
	drawColorReduction_popularity(srcImageData, dstImageData);
	break;
    case "linearCut": // 線形分割
	drawColorReduction_boxCut(srcImageData, dstImageData, "linear");
	break;
    case "medianCut": // 中央値分割
	drawColorReduction_boxCut(srcImageData, dstImageData, "median");
	break;
    case "populationEqualization": // 頻度均等化
	drawColorReduction_populationEqualization(srcImageData, dstImageData);
	break;
    case "kMeans": // K-平均法
	drawColorReduction_kMeans(srcImageData, dstImageData);
	break;
    default:
	console.error("Unknown quantizeMethod:"+quantizeMethod);
	break;
    }
}

/*
 * 均等量子化法 (uniform quqntization)
 */
function drawColorReduction_uniform(srcImageData, dstImageData) {
    // console.debug("drawColorReduction");
    //
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstWidth = dstImageData.width, dstHeight = dstImageData.height;
    //
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    var [r,g,b] = rgba;
//	    rgba[0] = Math.round(r * 7 / 0xff) * 0xff / 7;
//	    rgba[1] = Math.round(g * 5 / 0xff) * 0xff / 5;
//	    rgba[2] = Math.round(b * 4 / 0xff) * 0xff / 4;
	    rgba[0] = (r & 0xe0) + (0xff-0xe0)/2 // 1110 0000
	    rgba[1] = (g & 0xe0) + (0xff-0xe0)/2 // 1110 0000
	    rgba[2] = (b & 0xc0) + (0xff-0xc0)/2 // 1100 0000
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * 頻度法 popularity algorithm
 */
function drawColorReduction_popularity(srcImageData, dstImageData) {
    // console.debug("drawColorReduction");
    //
    var srcWidth = srcImageData.width, srcHeight = srcImageData.height;
    var dstWidth = dstImageData.width, srcHeight = dstImageData.height;
    //
    var hist = getColorHistogram(srcImageData);
    var colorNum = Object.keys(hist).length;
    var histArray = [];
    for (var colorId in hist) {
	colorId = parseFloat(colorId);
	histArray.push({colorId:colorId, count:hist[colorId]});
    }
    console.debug("HistogramSort");
    console.time("HistogramSort");
    histArray.sort(function(a, b) {
	return (a.count < b.count)?1:-1; // descend order
    });
    console.timeEnd("HistogramSort");
    var paletteNum = (colorNum < 256)?colorNum:256;
    var palette = new Uint32Array(paletteNum);
    var colorId = null;
    var colorMap = {}
    console.debug("ColorMapMaking");
    console.time("ColorMapMaking");
    for (var i = 0 ; i < paletteNum ; i++) {
	colorId = histArray[i].colorId;
	palette[i] = colorId;
	colorMap[colorId]= colorId;
    }
    for (var i = paletteNum ; i < colorNum ; i++) {
	colorId = histArray[i].colorId;
	var closestId = palette[0];
	var closestDistance = getColorIdDistance_nosqrt(colorId, closestId);
	for (var j = 1 ; j < paletteNum ; j++) {
	    var distance = getColorIdDistance_nosqrt(colorId, palette[j]);
	    if (distance < closestDistance) {
		closestId = palette[j];
		closestDistance = distance;
	    }
	}
	colorMap[colorId] = closestId;
	// console.debug(colorId2RGBA(colorId), colorId2RGBA(closestId), closestDistance);
    }
    console.timeEnd("ColorMapMaking");
    for (var srcY = 0 ; srcY < srcHeight; srcY++) {
        for (var srcX = 0 ; srcX < srcWidth; srcX++) {
	    var dstX = srcX, dstY = srcY;
	    var rgba = getRGBA(srcImageData, srcX, srcY);
	    colorId = RGBA2colorId(rgba);
	    colorId = colorMap[colorId];
	    rgba = colorId2RGBA(colorId);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
}

/*
 * common for the methods below:
 * work on the unique RGB colors with their pixel counts (alpha is kept
 * per pixel), and make a palette of up to PALETTE_SIZE colors.
 */
const PALETTE_SIZE = 256;

function getRGBHistogram(imageData) {
    const data = imageData.data;
    const map = new Map();
    for (let i = 0, n = data.length ; i < n ; i += 4) {
	const key = (data[i] << 16) | (data[i+1] << 8) | data[i+2];
	map.set(key, (map.get(key) || 0) + 1);
    }
    const n = map.size;
    const colors = new Uint8Array(n * 3);
    const counts = new Uint32Array(n);
    let j = 0;
    for (const [key, count] of map) {
	colors[j*3]   = (key >> 16) & 0xff;
	colors[j*3+1] = (key >>  8) & 0xff;
	colors[j*3+2] =  key        & 0xff;
	counts[j] = count;
	j++;
    }
    return { colors, counts, n };
}

// count-weighted mean color of the given color indices
function meanColor(hist, indices) {
    const { colors, counts } = hist;
    let r = 0, g = 0, b = 0, total = 0;
    for (const idx of indices) {
	const c = counts[idx];
	r += colors[idx*3] * c;
	g += colors[idx*3+1] * c;
	b += colors[idx*3+2] * c;
	total += c;
    }
    return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
}

// paint every pixel with the palette color of its unique color index
// colorIndex: unique color index -> palette index
function drawByColorIndex(srcImageData, dstImageData, hist, colorIndex, palette) {
    const { colors, n } = hist;
    const keyToPalette = new Map();
    for (let i = 0 ; i < n ; i++) {
	const key = (colors[i*3] << 16) | (colors[i*3+1] << 8) | colors[i*3+2];
	keyToPalette.set(key, colorIndex[i]);
    }
    const src = srcImageData.data, dst = dstImageData.data;
    for (let i = 0, len = src.length ; i < len ; i += 4) {
	const key = (src[i] << 16) | (src[i+1] << 8) | src[i+2];
	const [r, g, b] = palette[keyToPalette.get(key)];
	dst[i] = r; dst[i+1] = g; dst[i+2] = b;
	dst[i+3] = src[i+3];
    }
}

/*
 * box splitting in the RGB cube (linear cut / median cut)
 *  linear: split the box with the longest side at the middle of that side
 *  median: split the most populated box at the pixel median of its longest side
 */
function makeBox(hist, indices) {
    const { colors, counts } = hist;
    const min = [255, 255, 255], max = [0, 0, 0];
    let population = 0;
    for (const idx of indices) {
	for (let c = 0 ; c < 3 ; c++) {
	    const v = colors[idx*3+c];
	    if (v < min[c]) { min[c] = v; }
	    if (v > max[c]) { max[c] = v; }
	}
	population += counts[idx];
    }
    let axis = 0;
    for (let c = 1 ; c < 3 ; c++) {
	if ((max[c] - min[c]) > (max[axis] - min[axis])) {
	    axis = c;
	}
    }
    return { indices, min, max, population, axis,
	     length: max[axis] - min[axis] };
}

function splitBox(hist, box, mode) {
    const { colors, counts } = hist;
    const { indices, min, max, axis } = box;
    let threshold;
    if (mode === "median") {
	const sorted = Array.from(indices).sort((a, b) =>
	    colors[a*3+axis] - colors[b*3+axis]);
	const half = box.population / 2;
	let sum = 0;
	threshold = max[axis];
	for (const idx of sorted) {
	    sum += counts[idx];
	    if (sum >= half) {
		threshold = colors[idx*3+axis];
		break;
	    }
	}
	if (threshold >= max[axis]) { // keep the both sides non-empty
	    threshold = max[axis] - 1;
	}
    } else {  // linear
	threshold = (min[axis] + max[axis]) >> 1;
    }
    const lower = [], upper = [];
    for (const idx of indices) {
	if (colors[idx*3+axis] <= threshold) {
	    lower.push(idx);
	} else {
	    upper.push(idx);
	}
    }
    return [makeBox(hist, lower), makeBox(hist, upper)];
}

function boxCutPalette(hist, mode) {
    const all = new Uint32Array(hist.n);
    for (let i = 0 ; i < hist.n ; i++) { all[i] = i; }
    const boxes = [makeBox(hist, all)];
    while (boxes.length < PALETTE_SIZE) {
	// the box to split next (only boxes with more than one color)
	let target = -1;
	for (let i = 0 ; i < boxes.length ; i++) {
	    const box = boxes[i];
	    if (box.length === 0) {
		continue;
	    }
	    if ((target < 0) ||
		((mode === "median") ? (box.population > boxes[target].population)
		                      : (box.length > boxes[target].length))) {
		target = i;
	    }
	}
	if (target < 0) {
	    break;  // every box has a single color
	}
	const [lower, upper] = splitBox(hist, boxes[target], mode);
	boxes.splice(target, 1, lower, upper);
    }
    const palette = [];
    const colorIndex = new Uint32Array(hist.n);
    boxes.forEach(function(box, i) {
	palette.push(meanColor(hist, box.indices));
	for (const idx of box.indices) {
	    colorIndex[idx] = i;
	}
    });
    return { palette, colorIndex };
}

function drawColorReduction_boxCut(srcImageData, dstImageData, mode) {
    const hist = getRGBHistogram(srcImageData);
    const { palette, colorIndex } = boxCutPalette(hist, mode);
    drawByColorIndex(srcImageData, dstImageData, hist, colorIndex, palette);
}

/*
 * 頻度均等化 (population equalization)
 * like the uniform quantization (R:8, G:8, B:4 levels), but the level
 * boundaries of each channel are chosen to have the same number of pixels
 * (quantiles), and each cell is painted with its mean color.
 */
function drawColorReduction_populationEqualization(srcImageData, dstImageData) {
    const hist = getRGBHistogram(srcImageData);
    const { colors, counts, n } = hist;
    const levels = [8, 8, 4];
    const total = srcImageData.width * srcImageData.height;
    // value -> level for each channel
    const levelTable = levels.map(function(nLevel, c) {
	const chHist = new Float64Array(256);
	for (let i = 0 ; i < n ; i++) {
	    chHist[colors[i*3+c]] += counts[i];
	}
	const table = new Uint8Array(256);
	let before = 0;
	for (let v = 0 ; v < 256 ; v++) {
	    const center = before + chHist[v] / 2;  // the middle of this value
	    table[v] = Math.min(nLevel - 1, Math.floor(nLevel * center / total));
	    before += chHist[v];
	}
	return table;
    });
    const cells = new Map();  // cell number -> color indices
    for (let i = 0 ; i < n ; i++) {
	const cell = (levelTable[0][colors[i*3]] * levels[1] +
		      levelTable[1][colors[i*3+1]]) * levels[2] +
	      levelTable[2][colors[i*3+2]];
	if (! cells.has(cell)) {
	    cells.set(cell, []);
	}
	cells.get(cell).push(i);
    }
    const palette = [];
    const colorIndex = new Uint32Array(n);
    for (const indices of cells.values()) {
	for (const idx of indices) {
	    colorIndex[idx] = palette.length;
	}
	palette.push(meanColor(hist, indices));
    }
    drawByColorIndex(srcImageData, dstImageData, hist, colorIndex, palette);
}

/*
 * K-平均法 (k-means)
 * start from the median cut palette, then repeat assigning each color to
 * the nearest center and moving the centers to the mean of their colors.
 * distance: plain RGB euclidean (the mean minimizes it)
 */
function drawColorReduction_kMeans(srcImageData, dstImageData) {
    const MAX_ITERATION = 10;
    const hist = getRGBHistogram(srcImageData);
    const { colors, counts, n } = hist;
    const initial = boxCutPalette(hist, "median").palette;
    const k = initial.length;
    const centers = new Float64Array(k * 3);
    initial.forEach(function([r, g, b], i) {
	centers[i*3] = r; centers[i*3+1] = g; centers[i*3+2] = b;
    });
    const colorIndex = new Uint32Array(n);
    const sums = new Float64Array(k * 3);
    const weights = new Float64Array(k);
    const assign = function() {
	for (let i = 0 ; i < n ; i++) {
	    const r = colors[i*3], g = colors[i*3+1], b = colors[i*3+2];
	    let best = 0, bestDist = Infinity;
	    for (let j = 0 ; j < k ; j++) {
		const dr = r - centers[j*3];
		const dg = g - centers[j*3+1];
		const db = b - centers[j*3+2];
		const dist = dr*dr + dg*dg + db*db;
		if (dist < bestDist) {
		    bestDist = dist;
		    best = j;
		}
	    }
	    colorIndex[i] = best;
	}
    };
    for (let iter = 0 ; iter < MAX_ITERATION ; iter++) {
	assign();
	// update
	sums.fill(0);
	weights.fill(0);
	for (let i = 0 ; i < n ; i++) {
	    const j = colorIndex[i], c = counts[i];
	    sums[j*3]   += colors[i*3] * c;
	    sums[j*3+1] += colors[i*3+1] * c;
	    sums[j*3+2] += colors[i*3+2] * c;
	    weights[j] += c;
	}
	let moved = 0;
	for (let j = 0 ; j < k ; j++) {
	    if (weights[j] === 0) {
		continue;  // empty cluster: keep the center
	    }
	    for (let c = 0 ; c < 3 ; c++) {
		const v = sums[j*3+c] / weights[j];
		moved = Math.max(moved, Math.abs(v - centers[j*3+c]));
		centers[j*3+c] = v;
	    }
	}
	if (moved < 0.5) {
	    break;  // converged
	}
    }
    assign();  // to the final centers
    const palette = [];
    for (let j = 0 ; j < k ; j++) {
	palette.push([Math.round(centers[j*3]), Math.round(centers[j*3+1]),
		      Math.round(centers[j*3+2])]);
    }
    drawByColorIndex(srcImageData, dstImageData, hist, colorIndex, palette);
}
