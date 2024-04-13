"use strict";
/*
 * 2017/07/02- (c) yoya@awm.jp
 */

function interpMatrix(mat1, mat2, x) {
    if (mat1.length !== mat2.length) {
        console.error("mat1.length:"+mat1.length+" !== mat2.length:"+mat2.length);
        return null;
    }
    var mat3 = mat1.concat(); // array clone
    for(var i = 0, n = mat1.length ; i < n ; i++) {
        mat3[i] = mat1[i] * (1-x) +  mat2[i] * x;
    }
    return mat3;
}

// http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/tech23.html
function invertMatrix(mat, matWindow) {
    var invMat = null;
    switch(matWindow) {
    case 3:
	var [a11, a12, a13, a21, a22, a23, a31, a32, a33] = mat;
	var det = (a11*a22*a33 + a21*a32*a13 + a31*a12*a23)
            - (a11*a32*a23 + a31*a22*a13 + a21*a12*a33);
	invMat = [(a22*a33-a23*a32)/det, (a13*a32-a12*a33)/det, (a12*a23-a13*a22)/det,
		  (a23*a31-a21*a33)/det, (a11*a33-a13*a31)/det, (a13*a21-a11*a23)/det,
		  (a21*a32-a22*a31)/det, (a12*a31-a11*a32)/det, (a11*a22-a12*a21)/det];
	break;
    default:
	console.error("Invalid matWindow:"+matWindow);
	break;
    }
    return invMat;
}

function extendToSquareMatrix(mat, matWindow) {
    const oldLength = mat.length;
    const newLength = matWindow * matWindow;
    if (newLength <= oldLength;) {
        if (newLength < oldLength;) {
            console.error("mat.length:"+mat.length+", matWindow:"+matWindow+", newLength:"+newLength);
        }
        return mat;
    }
    if (Array.isArray(mat)) {
        mat.length = newLength;
    } else {
        const proto = Object.getPrototypeOf(mat);
        const newMat = new proto.constructor(newLength);
        newMat.set(mat);
        mat = newMat;
    }
    for (let i = oldLength ; i < newLength ; i++) {
        mat[i] = (i % (matWindow + 1))?0: 1;  // 対角要素は 1 、それ以外は 0
    }
    return mat;
}
