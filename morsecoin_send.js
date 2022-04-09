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
    drawMorseSendAlphabet(canvas);
}

function drawMorseSendAlphabet(canvas) {
    for (const a of morseSendAlphabetList) {
        const [c, x, y, ...ca] = a;
        console.log(a, c, x, y, ca);
        drawMorseSendPointAndAlphabet(canvas, a);        
    }
}

function drawMorseSendPointAndAlphabet(canvas, a) {
    drawMorseSendPoint(canvas, a);
    drawMorseSendAlphabet(canvas, a);
}

function drawMorseSendPoint(canvas, a, color, idx) {
    ;
}

function drawMorseSendAlphabet(canvas, a) {
    ;
}

const morseSendAlphabetList = [  // false:.  true:-
    ['A', 0.5, 0.5, false, true],
];



