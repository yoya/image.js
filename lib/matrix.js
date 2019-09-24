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
	var det = a11*a22*a33 + a21*a32*a13 + a31*a12*a23 - a11*a32*a23 - a31*a22*a13 - a21*a12*a33;
	invMat = [a22*a33-a23*a32, a13*a32-a12*a33, a12*a23-a13*a22,
		  a23*a31-a21*a33, a11*a33-a13*a31, a13*a21-a11*a23,
		  a21*a32-a22*a31, a12*a31-a11*a32, a11*a22-a12*a21];
	invMat = invMat.map(function(v) { return v/det; });
	break;
    default:
	console.error("Invalid matWindow:"+matWindow);
	break;
    }
    return invMat;
}
