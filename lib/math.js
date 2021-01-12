"use strict";
/*
 * 2017/07/01- (c) yoya@awm.jp
 */

function sinc(x) {
    var pi_x = Math.PI * x;
    return Math.sin(pi_x) / pi_x;
}

function sincFast(x) {
    var xx = x * x;
    // quantim depth 8
    var c0 = 0.173610016489197553621906385078711564924e-2;
    var c1 = -0.384186115075660162081071290162149315834e-3;
    var c2 = 0.393684603287860108352720146121813443561e-4;
    var c3 = -0.248947210682259168029030370205389323899e-5;
    var c4 = 0.107791837839662283066379987646635416692e-6;
    var c5 = -0.324874073895735800961260474028013982211e-8;
    var c6 = 0.628155216606695311524920882748052490116e-10;
    var c7 = -0.586110644039348333520104379959307242711e-12;
    var p =
	c0+xx*(c1+xx*(c2+xx*(c3+xx*(c4+xx*(c5+xx*(c6+xx*c7))))));
    return (xx-1.0)*(xx-4.0)*(xx-9.0)*(xx-16.0)*p;
}

function gaussian(x, y, sigma) {
    var sigma2 = sigma * sigma;
    return Math.exp(- (x*x + y*y) / (2 * sigma2)) / (2 * Math.PI * sigma2);
}

function pascalTriangle(n) {
    var arr = new Float64Array(n);
    arr.fill(1);
    for (let i = 2; i < n; i++) {
        for (let j = n - i; j < (n - 1); j++) {
            arr[j] = arr[j] + arr[j+1];
        }
    }
    return arr;
}

function homography(x, y, coeff) {
    let [a, b, c, d, e, f, g, h, i] = coeff;
    let denom = (g*x + h*y + i);
    let xx = (a*x + b*y + c) / denom;
    let yy = (d*x + e*y + f) / denom;
    return [xx, yy];
}

function homographyCoeffByMarkers(markers, toSquare) {
    if (toSquare) {
        return homographyCoeffByMarkersToSquare(markers);
    }
    return homographyCoeffByMarkersFromSquare(markers);
}

/*
  https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu?slide=16
  markers index: 0,1,2,3  => 00,10,11,01
  square => trapezoid(markers)
*/
function homographyCoeffByMarkersFromSquare(markers) {
    // console.debug("markers2coeff:", markerArray);
    var [[x00,y00], [x10,y10], [x11,y11], [x01,y01]] = markers;
    let dx0100 = x01 - x00, dx1000 = x10 - x00;  // dx = xij - x00
    let dy0100 = y01 - y00, dy1000 = y10 - y00;  // dy = yij - y00
    let dx1101 = x11 - x01, dx1110 = x11 - x10;  // Dx = x11 - xij
    let dy1101 = y11 - y01, dy1110 = y11 - y10;  // Dy = y11 - yij
    let xi = dx1101 * dy1110 - dx1110 * dy1101;
    let c = x00;
    let f = y00;
    let g = ( dy1000 * dx1101 - dx1000 * dy1101) / xi;
    let h = (-dy0100 * dx1110 + dx0100 * dy1110) / xi;
    let a = (dx1000*(x11*y01 - x01*y11) + dx1101*(x00*y10 - x10*y00)) / xi;
    let d = (dy1101*(x00*y10 - y00*x10) + dy1000*(y01*x11 - y11*x01)) / xi;
    let b = (dx1110*(y00*x01 - x00*y01) + dx0100*(y11*x10 - x11*y10)) / xi;
    let e = (dy0100*(y11*x10 - y10*x11) + dy1110*(y00*x01 - y01*x00)) / xi;
    return [a, b, c, d, e, f, g, h, 1];
}

/*
  https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu?slide=33
  markers index: 0,1,2,3  => 00,10,11,01
  trapezoid(markers) => square
*/
function homographyCoeffByMarkersToSquare(markers) {
    // console.debug("markers2coeff:", markerArray);
    let [[x00,y00], [x10,y10], [x11,y11], [x01,y01]] = markers;
    let dx0100 = x01 - x00, dx1000 = x10 - x00;  // dx = xij - x00
    let dy0100 = y01 - y00, dy1000 = y10 - y00;  // dy = yij - y00
    let dx1101 = x11 - x01, dx1110 = x11 - x10;  // Dx = x11 - xij
    let dy1101 = y11 - y01, dy1110 = y11 - y10;  // Dy = y11 - yij
    let dx0110 = x01 - x10, dy0110 = y01 - y10;  // ex, ey
    let delta = dx1000 * dy0100 - dx0100 * dy1000;
    let abcd_num = dx1110 * dy0110 - dx0110 * dy1110;
    let ab_denom = dx1101 * dy0100 - dx0100 * dy1101;
    let de_denom = dx1110 * dy1000 - dx1000 * dy1110;
    let ab = abcd_num / ab_denom, de = abcd_num / de_denom;
    let gh01 = (dx1000*dy1101 - dx1110*dy1000) / (dx1101*dy0100 - dx0100*dy1101);
    let gh10 = (dx0100*dy1110 - dx1110*dy0100) / (dx1110*dy1000 - dx1000*dy1110);
    let a =  (dy0100/delta) * ab;
    let b = -(dx0100/delta) * ab;
    let d =  (dy1000/delta) * de;
    let e = -(dx1000/delta) * de;
    let g = (1/delta) * ( dy0100*gh01 - dy1000*gh10);
    let h = (1/delta) * (-dx0100*gh01 + dx1000*gh10);
    let c = -a*x00 - b*y00;
    let f = -d*x00 - e*y00;
    let i = 1 - g*x00 - h*y00;
    //
    return [a, b, c, d, e, f, g, h, i];
}
