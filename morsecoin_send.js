"use strict";
/*
 * 2022/03/25- (c) yoya@awm.jp
 */

function drawMorseSend(canvas) {
    const ctx = canvas.getContext("2d");
    drawCoinCircle(canvas);
    drawTextCenteringWithRotate(canvas, "SEND", 0.06, 0.35, 0.2,
                                -26*Math.PI/180);
    drawTextCenteringWithRotate(canvas, "SIDE", 0.06, 0.65, 0.2,
                                26*Math.PI/180);
    drawMorseSendPointAndAlphabet(canvas);
}

function drawMorseSendPointAndAlphabet(canvas) {
    for (const a of morseSendAlphabetList) {
        drawMorseSendPoint(canvas, a);
        drawMorseSendAlphabet(canvas, a);
    }
}

function drawMorseSendPoint(canvas, a, color, idx) {
    if (a.length === 1) {
        const aa = morseSendAlphabetListEntryByAlphabet(a);
        if (aa !== null) {
            a = aa;
        } else {
            console.warn("alphabet unmatch:"+a);
            return ;
        }
    }
    if (color === undefined) { color = "#eeee00"; }
    const ctx = canvas.getContext("2d");
    const {width, height} = canvas;
    const [c, x0, y0, ...ma] = a;
    ctx.save();
    ctx.fillStyle = color;
    let x = x0 + 0.02;
    let y = y0;
    for (const i in ma) {
        const m = ma[i];
        ctx.beginPath();
        if (m) { // morse long code
            const xlen = 0.05;
            const ylen = 0.01;
            x += 0.005;
            if ((idx === undefined) || (i == idx)) {
                ctx.rect(x*width, (y-ylen/2)*height, width*xlen, height*ylen);
            }
            x += 0.055;
        } else { // morse short code
            x += 0.01;
            if ((idx === undefined) || (i == idx)) {
                ctx.arc(x*width, y*height, width*0.008, 0, 2*Math.PI);
            }
            x += 0.01;
        }
        ctx.fill();
    }
    ctx.restore();
}

function drawMorseSendAlphabet(canvas, a, color) {
    if (a.length === 1) {
        const aa = morseSendAlphabetListEntryByAlphabet(a);
        if (aa !== null) {
            a = aa;
        } else {
            console.warn("alphabet unmatch:"+a);
            return ;
        }
    }
    if (color === undefined) { color = "#eeee00"; }
    const [c, x, y] = a;
    drawTextCenteringWithRotate(canvas, c, 0.05, x, y, 0, color);
}

/*
 * Data Accessor
 */

function morseSendAlphabetListEntryByAlphabet(alphabet) {
    for (const a of morseSendAlphabetList) {
        if (a[0] === alphabet) {
            return a;
        }
    }
    return null;
}

/*
 * Data List
 */

const morseSendAlphabetList = [  // false:.  true:-
    ['A', 0.21, 0.3, false, true],  // ._
    ['B', 0.17, 0.36, true, false, false, false],  // _...
    ['C', 0.15, 0.43, true, false, true, false], // _._.
    ['D', 0.15, 0.50, true, false, false],  // _..
    ['E', 0.15, 0.57, false],  // .
    ['F', 0.17, 0.64, false, false, true, false],  // .._.
    ['G', 0.2, 0.7, true, true, false],  // __.
    ['H', 0.25, 0.75, false, false, false, false],  // ....
    ['I', 0.3, 0.8, false, false],  // ..
    //
    ['J', 0.42, 0.27, false, true, true, true],  // .___
    ['K', 0.40, 0.33, true, false, true],  // _._
    ['L', 0.40, 0.39, false, true, false, false],  // ._..
    ['M', 0.39, 0.45, true, true],  // __
    ['N', 0.39, 0.51, true, false],  // _.
    ['O', 0.38, 0.57, true, true, true],  // ___
    ['P', 0.40, 0.64, false, true, true, false],  // .__.
    ['Q', 0.41, 0.70, true, true, false, true],  // __._
    ['R', 0.43, 0.77, false, true, false],  // ._.
    ['S', 0.45, 0.83, false, false, false],  // ...
    //
    ['T', 0.62, 0.36, true],  // _
    ['U', 0.62, 0.42, false, false, true],  // .._
    ['V', 0.62, 0.48, false ,false, false, true],  // ..._
    ['W', 0.62, 0.54, false, true, true],  // .__
    ['X', 0.62, 0.61, true, false, false, true],  // _.._
    ['Y', 0.62, 0.67, true, false, true, true],  // _.__
    ['Z', 0.62, 0.74, true, true, false, false],  // __..
];



