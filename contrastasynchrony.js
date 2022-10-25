"use strict";
/*
 * 2019/06/07- (c) yoya@awm.jp
 * ref) http://illusionscience.com/contrast-asynchrony/
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});


const canvas = document.getElementById("canvas");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");

function main() {
    // console.debug("main");
    const widthRange = document.getElementById("widthRange");
    const heightRange = document.getElementById("heightRange");
    const periodRange = document.getElementById("periodRange");
    const params = {
        canvas:canvas,
        width: parseFloat(widthRange.value),
        height:parseFloat(heightRange.value),
        elapse:1000 / 24, // 24fps
        //elapse: 1000 / 4, // debug
        period: parseFloat(periodRange.value),
        timerId: -1,
    };
    bindFunction( {"widthRange":"widthText",
                   "heightRange":"heightText",
                   "periodRange":"periodText",
                   "debug1Checkbox":null,
                   "debug2Checkbox":null,
                   "debug3Checkbox":null
                  }, function(target, rel) {
                      // start(params);
		  }, params);
    start(params);
}

function start(params) {
    stop(params);
    const ctx = new function() {
        this.params = params;
        this.ticks = 0;
    }
    params.timerId = setInterval(drawContrastAsynchrony.bind(ctx), params.elapse);
}

function stop(params) {
    const { timerId } = params;
    if (timerId >= 0) {
        clearInterval(timerId);
        params.timerId = -1;
    }
}

function drawContrastAsynchrony() {
    const ticks = this.ticks ; this.ticks++;
    const params = this.params;
    const { elapse } = params;
    const width  = params.widthRange;
    const height = params.heightRange;
    const period = params.periodRange;
    const debug1 = params.debug1Checkbox;
    const debug2 = params.debug2Checkbox;
    const debug3 = params.debug3Checkbox;
    //
    const progress = (ticks%(period*1000/elapse)) / (period*1000/elapse);
    const radius = width / 5;
    const x1 = width/2 - radius*1.1, y1 = height/2.2;
    const x2 = width/2 + radius*1.1, y2 = height/2.2;
    const v = (progress<0.5)?(2*255 * progress):(2*255*(1.0-progress))
    //
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (! debug1) {
        drawCircle(ctx, x1, y1, radius, "black");
        drawCircle(ctx, x2, y2, radius, "rgb(255,255,200)");
    }
    const color = "rgb("+v+","+v+","+v+")";
    if (debug2) {
        canvas.style.backgroundColor = color;
    } else {
        canvas.style.backgroundColor = "gray";
    }
    drawCircle(ctx, x1, y1, radius/2, color);
    drawCircle(ctx, x2, y2, radius/2, color);
    if (debug3) {
        drawRectangle(ctx, x1, y1 - radius/3, x2, y2 + radius/3, color);
    }
}

function drawCircle(ctx, cx, cy, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    ctx.fill();
}

function drawRectangle(ctx, x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.fill();
}
