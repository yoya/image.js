"use strict";
/*
 * 2018/01/21- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

function main() {
    // console.debug("main");
    var canvas = document.getElementById("canvas");
    var widthRange = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var params = {
        canvas:canvas,
        width: parseFloat(widthRange.value),
        height:parseFloat(heightRange.value),
        elapse: 1000 / 24, // 24fps
        // elapse: 1000 / 4, // debug
        count: 10,
    };
    bindFunction({"widthRange":"widthText",
                  "heightRange":"heightText"},
		 function(target, rel) {
                     params['width']  = parseFloat(widthRange.value);
                     params['height'] = parseFloat(heightRange.value);
                     params['backgroundImage'] = getTestcardImage(params.width, params.height);
		     drawCountDown(params);
		 } );
    params['backgroundImage'] = getTestcardImage(params.width, params.height);
    drawCountDown(params);
}

var timerId = null;
function drawCountDown(params) {
    var canvas = params.canvas;
    canvas.width = params.width;
    canvas.height = params.height;
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    var ctx = new function() {
        this.params = params;
        this.ticks = 0;
        this.count = 5;
    }
    timerId = setInterval(drawCountDownTicks.bind(ctx), params.elapse);
}

function drawCountDownTicks() {
    var ticks = this.ticks ; this.ticks++;
    var count = this.count;
    var params = this.params;
    var canvas = params.canvas;
    var elapse = params.elapse;
    var width = canvas.width, height = canvas.height;
    //
    var ticks_interval = 1000 / elapse;
    var count_number = 1 + count - ((ticks/ticks_interval) | 0);
    var ticks_in_count =  ticks - ticks_interval * (count-count_number+1);
    // console.log(count_number+","+ticks_in_count);
    if (count_number <= 0) {
        if (timerId === null) {
            console.warning("timerId === null");
        }
        clearInterval(timerId);
        timerId = null;
    }
    var ctx = canvas.getContext("2d");
    canvas.width = width; // clear
    var backgroundImage = params.backgroundImage;
    ctx.putImageData(backgroundImage, 0, 0);

    // count 範囲内でカウントダウン表示
    if (count_number <= count) {
        var center_x = width / 2, center_y = height / 2;
        //円を描画
        var angle_ratio = (ticks_interval-ticks_in_count)/ticks_interval;
        
        //
        var x = center_x, y = center_y;
        var radius = height/2;
        var offsetAngle = -Math.PI/2;
        var startAngle = offsetAngle;
        var endAngle = offsetAngle - 2 * Math.PI * (angle_ratio);
        // console.log("ratio:"+angle_ratio);
        ctx.beginPath();
        ctx.fillStyle ="blue";
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle, true);
        ctx.lineTo(x, y);
        ctx.fill();
        //文字を描画
        var x = center_x, y = center_y;;
        var fontSize = height/2;
        var weight = 900
        var text = "" + count_number;
        ctx.font = ""+weight+" "+fontSize+"px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center"; 
        ctx.fillStyle ="white";
        ctx.strokeStyle ="black";
        ctx.lineWidth = width / 256;
        ctx.fillText(text, x, y);
        ctx.strokeText(text, x, y);
    }
}
