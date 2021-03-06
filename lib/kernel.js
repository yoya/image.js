/*
 * 2021/03/06- (c) yoya@awm.jp
 *
 * require canvas.js, math.js
 */

function makeKernel_PascalTriangle(filterWindow) {
    let filterMatrix = new Float32Array(filterWindow * filterWindow);
    const triangle = pascalTriangle(filterWindow);
    let i = 0;
    for (let y = 0; y < filterWindow; y++) {
        for (let x = 0 ; x < filterWindow; x++) {
            filterMatrix[i++] = triangle[x] * triangle[y];
        }
    }
    const total = filterMatrix.reduce(function(p, v) {return p+v; });;
    filterMatrix = filterMatrix.map(function(v) { return v / total; })
    return filterMatrix;
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
