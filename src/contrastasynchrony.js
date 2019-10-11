'use strict';
/*
 * 2019/06/07- (c) yoya@awm.jp
 * ref) http://illusionscience.com/contrast-asynchrony/
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

const canvas = document.getElementById('canvas');
const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');

function main() {
    // console.debug("main");
    const widthRange = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    const periodRange = document.getElementById('periodRange');
    const params = {
        canvas:canvas,
        width: parseFloat(widthRange.value),
        height:parseFloat(heightRange.value),
        elapse:1000 / 24, // 24fps
        // elapse: 1000 / 4, // debug
        period: parseFloat(periodRange.value)
    };
    bindFunction({
 'widthRange':'widthText',
                  'heightRange':'heightText',
                  'periodRange':'periodText'
},
		 function(target, rel) {
                     params.width  = parseFloat(widthRange.value);
                     params.height = parseFloat(heightRange.value);
                     params.period = parseFloat(periodRange.value);
                     start(params);
		 });
    start(params);
}

let timerId = null;

function start(params) {
    console.log(params);
    // downloadButton.disabled = true;
    const [width, height] = [params.width, params.height];
    canvas.width = width;
    canvas.height = height;
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    const ctx = new function() {
        this.params = params;
        this.ticks = 0;
    }();
    canvas.style.backgroundColor = 'gray';
    timerId = setInterval(drawContrastAsynchrony.bind(ctx), params.elapse);
    //
}

function drawContrastAsynchrony() {
    const ticks = this.ticks; this.ticks++;
    const params = this.params;
    const elapse = params.elapse;
    const period = params.period;
    const width = canvas.width; const height = canvas.height;
    //
    const progress = (ticks % (period * 1000 / elapse)) / (period * 1000 / elapse);
    const ctx = canvas.getContext('2d');
    canvas.width = width; // clear
    const radius = width / 5;
    const x1 = width / 2 - radius * 1.1; const y1 = height / 2.2;
    const x2 = width / 2 + radius * 1.1; const y2 = height / 2.2;
    drawCircle(ctx, x1, y1, radius, 'black');
    drawCircle(ctx, x2, y2, radius, 'rgb(255,255,200)');
    const v = (progress < 0.5) ? (2 * 255 * progress) : (2 * 255 * (1.0 - progress));
    const color = 'rgb(' + v + ',' + v + ',' + v + ')';
    drawCircle(ctx, x1, y1, radius / 2, color);
    drawCircle(ctx, x2, y2, radius / 2, color);
}

function drawCircle(ctx, cx, cy, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI, true);
    ctx.fill();
}
