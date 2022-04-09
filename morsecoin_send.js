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
    ;
}

function drawMorseSendAlphabet(canvas, a, color) {
    if (a.length === 1) {
        const aa = morseSndAlphabetListEntryByAlphabet(a);
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
    ['J', 0.44, 0.27, false, true, true, true],  // .___
    ['K', 0.42, 0.33, true, false, true],  // _._
    ['L', 0.42, 0.39, false, true, false, false],  // ._..
    ['M', 0.41, 0.45, true, true],  // __
    ['N', 0.41, 0.51, true, false],  // _.
    ['O', 0.40, 0.58, true, true, true],  // ___
    ['P', 0.42, 0.64, false, true, true, false],  // .__.
    ['Q', 0.43, 0.70, true, true, false, true],  // __._
    ['R', 0.45, 0.76, false, true, false],  // ._.
    ['S', 0.47, 0.83, false, false, false],  // ...
    //
    ['T', 0.62, 0.37, true],  // _
    ['U', 0.62, 0.44, false, false, true],  // .._
    ['V', 0.62, 0.51, false ,false, false, true],  // ..._
    ['W', 0.62, 0.58, false, true, true],  // .__
    ['X', 0.62, 0.65, true, false, false, true],  // _.._
    ['Y', 0.62, 0.72, true, false, true, true],  // _.__
    ['Z', 0.62, 0.79, true, true, false, false],  // __..
];



