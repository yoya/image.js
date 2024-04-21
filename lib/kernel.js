/*
 * 2021/03/06- (c) yoya@awm.jp
 *
 * require canvas.js, math.js
 */

function makeKernel_PascalTriangle_1D(filterWindow) {
    const triangle = pascalTriangle(filterWindow);
    const total = triangle.reduce(function(p, v) {return p+v; });;
    const filterVector = triangle.map(function(v) { return v / total; })
    return filterVector;  // Float64Array
}

function makeKernel_PascalTriangle_2D(filterWindow) {
    const filterMatrix = new Float32Array(filterWindow * filterWindow);
    const filterVector = makeKernel_PascalTriangle_1D(filterWindow);
    let i = 0;
    for (let y = 0; y < filterWindow; y++) {
        for (let x = 0 ; x < filterWindow; x++) {
            filterMatrix[i++] = filterVector[x] * filterVector[y];
        }
    }
    return filterMatrix;  // Float32Array
}

function makeKernel_Gaussian(filterWindow, sigma) {
    let filterMatrix = new Float32Array(filterWindow * filterWindow);
    let center = Math.floor(filterWindow/2);
    let i = 0;
    for (let y = 0; y < filterWindow; y++) {
        for (let x = 0 ; x < filterWindow; x++) {
            const dx = Math.abs(x - center);
            const dy = Math.abs(y - center);
	    filterMatrix[i++] = gaussian(dx, dy, sigma);
        }
    }
    const total = filterMatrix.reduce(function(p, v) {return p+v; });;
    filterMatrix = filterMatrix.map(function(v) { return v / total; })
    return filterMatrix;
}    

function makeKernel_Mean_1D(filterWindow) {
    var filterVector = new Float32Array(filterWindow);
    filterVector.fill(1);
    const total = filterVector.reduce(function(p, v) {return p+v; });;
    filterVector = filterVector.map(function(v) { return v / total; })
    return filterVector;  // Float32Array
}
