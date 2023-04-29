"use strict";
/*
 * 2018/01/21- (c) yoya@awm.jp
 * ref) https://github.com/webrtc/samples/blob/gh-pages/src/content/capture/canvas-record/js/main.js
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});


var canvas = document.getElementById("canvas");
var video = document.getElementById("video");
var playButton = document.getElementById("playButton");
var stopButton = document.getElementById("stopButton");
var downloadButton = document.getElementById("downloadButton");
var typeSelect = document.getElementById("typeSelect");

var stream = canvas.captureStream(24);
video.srcObject = stream;
// downloadButton.disabled = false;

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
var mediaRecorder;
var recordedBlobs;
var sourceBuffer;

function main() {
    // console.debug("main");
    var options = {mimeType: 'video/webm;codecs=vp9'};
    var widthRange = document.getElementById("widthRange");
    var heightRange = document.getElementById("heightRange");
    var params = {
        canvas:canvas,
        video:video,
        width: parseFloat(widthRange.value),
        height:parseFloat(heightRange.value),
        type: typeSelect.value,
        elapse: 1000 / 24, // 24fps
        // elapse: 1000 / 4, // debug
        count: 10,
    };
    bindFunction({"widthRange":"widthText",
                  "heightRange":"heightText",
                  "typeSelect":null},
		 function(target, rel) {
                     params['width']  = parseFloat(widthRange.value);
                     params['height'] = parseFloat(heightRange.value);
                     params['type'] = typeSelect.value;
                     drawBackgroundImage(params);
		 } );
    bindFunction({"playButton":null},
		 function(target, rel) {
		     start(params);
		 } );
    bindFunction({"stopButton":null},
		 function(target, rel) {
		     stop();
		 } );
    bindFunction({"downloadButton":null},
		 function(target, rel) {
		     download();
		 } );
    // start(params);
    drawBackgroundImage(params);
}

var timerId = null;
function start(params) {
    // downloadButton.disabled = true;
    var [width, height] = [params.width, params.height];
    canvas.width = width;
    canvas.height = height;
    video.width = width;
    video.height = height;
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    var ctx = new function() {
        this.params = params;
        this.ticks = 0;
        this.count = 5;
    }
    timerId = setInterval(drawCountDown.bind(ctx), params.elapse);
    //
    startRecording();
}

function startRecording() {
  let options = {mimeType: 'video/webm'};
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
        options = {mimeType: 'video/webm,codecs=vp9'};
        // options = {mimeType: 'video/webm,codecs=h264'};
      mediaRecorder = new MediaRecorder(stream, options);
    } catch (e1) {
      console.log('Unable to create MediaRecorder with options Object: ', e1);
      try {
        options = 'video/vp8'; // Chrome 47
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e2) {
        alert('MediaRecorder is not supported by this browser.\n\n' +
          'Try Firefox 29 or later, or Chrome 47 or later, ' +
          'with Enable experimental Web Platform features enabled from chrome://flags.');
        console.error('Exception while creating MediaRecorder:', e2);
        return;
      }
    }
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  // recordButton.textContent = 'Stop Recording';
    // playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(100); // collect 100ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
  const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
  video.src = window.URL.createObjectURL(superBuffer);
}

function stop() {
    if (timerId === null) {
        // console.warn("timerId === null");
    } else {
        clearInterval(timerId);
        timerId = null;
    }
    stopRecording();
    downloadButton.disabled = false;
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
    //video.controls = true;
    video.controls = false;
}


function download() {
  const blob = new Blob(recordedBlobs, {type: 'video/webm'});
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'countdown.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

function drawBackgroundImage(params) {
    var [width, height] = [params.width, params.height];
    canvas.width  = width;
    canvas.height = height;
    video.width  = width;
    video.height = height;
    if (params.type === "testcard") {
        params.backgroundImage = getTestcardImage(params.width, params.height);
    } else {
        var image = new ImageData(params.width, params.height);
        var size = width * height * 4;
        for (var i = 0 ; i < size ; ) {
            var v = 127 + Math.random() * Math.random() * Math.random() * 72;
            image.data[i++] = v;
            image.data[i++] = v;
            image.data[i++] = v;
            image.data[i++] = 255; // alpha:255
        }
        params.backgroundImage = image;
    }
    var backgroundImage = params.backgroundImage;
    var ctx = canvas.getContext("2d");
    ctx.putImageData(backgroundImage, 0, 0);
}

function drawCountDown() {
    var ticks = this.ticks ; this.ticks++;
    var count = this.count;
    var params = this.params;
    var elapse = params.elapse;
    var width = canvas.width, height = canvas.height;
    //
    var ticks_interval = 1000 / elapse;
    var count_number = 1 + count - ((ticks/ticks_interval) | 0);
    var ticks_in_count =  ticks - ticks_interval * (count-count_number+1);
    // console.log(count_number+","+ticks_in_count);
    var ctx = canvas.getContext("2d");
    canvas.width = width; // clear
    var backgroundImage = params.backgroundImage;
    ctx.putImageData(backgroundImage, 0, 0);
    // count 範囲内でカウントダウン表示
    if ((0<= count_number) && (count_number <= count)) {
        var center_x = width / 2, center_y = height / 2;
        //円を描画
        var angle_ratio = (ticks_interval-ticks_in_count)/ticks_interval;
        
        //
        var x = center_x, y = center_y;
        var radius = height/2;
        var offsetAngle = -Math.PI/2;
        var startAngle = offsetAngle;
        var endAngle = offsetAngle - 2 * Math.PI * (angle_ratio);
        if (count_number == 0) {
            endAngle = startAngle + 2*Math.PI;
        }
        // console.log("ratio:"+angle_ratio);
        var grad  = ctx.createRadialGradient(x,y,0,x,y,radius);
        grad.addColorStop(0,'#F8FFF0');
        grad.addColorStop(0.8,'#450');
        grad.addColorStop(1,'#420');
        //
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle, true);
        ctx.fill();
        //文字を描画
        var x = center_x, y = center_y;;
        var fontSize = height/2;
        var weight = 900;
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
    if ((count_number < 0) && (ticks_interval == (ticks_in_count+1))) {
        stop();
    }
}
