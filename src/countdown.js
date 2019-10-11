'use strict';
/*
 * 2018/01/21- (c) yoya@awm.jp
 * ref) https://github.com/webrtc/samples/blob/gh-pages/src/content/capture/canvas-record/js/main.js
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

const canvas = document.getElementById('canvas');
const video = document.getElementById('video');
const playButton = document.getElementById('playButton');
const stopButton = document.getElementById('stopButton');
const downloadButton = document.getElementById('downloadButton');
const typeSelect = document.getElementById('typeSelect');

const stream = canvas.captureStream(24);
video.srcObject = stream;
// downloadButton.disabled = false;

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

function main() {
    // console.debug("main");
    const options = { mimeType: 'video/webm;codecs=vp9' };
    const widthRange = document.getElementById('widthRange');
    const heightRange = document.getElementById('heightRange');
    const params = {
        canvas:canvas,
        video:video,
        width: parseFloat(widthRange.value),
        height:parseFloat(heightRange.value),
        type: typeSelect.value,
        elapse: 1000 / 24, // 24fps
        // elapse: 1000 / 4, // debug
        count: 10
    };
    bindFunction({
'widthRange':'widthText',
                  'heightRange':'heightText',
                  'typeSelect':null
},
		 function(target, rel) {
                     params.width  = parseFloat(widthRange.value);
                     params.height = parseFloat(heightRange.value);
                     params.type = typeSelect.value;
                     drawBackgroundImage(params);
		 });
    bindFunction({ 'playButton':null },
		 function(target, rel) {
		     start(params);
		 });
    bindFunction({ 'stopButton':null },
		 function(target, rel) {
		     stop();
		 });
    bindFunction({ 'downloadButton':null },
		 function(target, rel) {
		     download();
		 });
    // start(params);
    drawBackgroundImage(params);
}

let timerId = null;
function start(params) {
    // downloadButton.disabled = true;
    const [width, height] = [params.width, params.height];
    canvas.width = width;
    canvas.height = height;
    video.width = width;
    video.height = height;
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
    const ctx = new function() {
        this.params = params;
        this.ticks = 0;
        this.count = 5;
    }();
    timerId = setInterval(drawCountDown.bind(ctx), params.elapse);
    //
    startRecording();
}

function startRecording() {
  let options = { mimeType: 'video/webm' };
  recordedBlobs = [];
  try {
    mediaRecorder = new MediaRecorder(stream, options);
  } catch (e0) {
    console.log('Unable to create MediaRecorder with options Object: ', e0);
    try {
      options = { mimeType: 'video/webm,codecs=vp9' };
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
  const superBuffer = new Blob(recordedBlobs, { type: 'video/webm' });
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
    // video.controls = true;
    video.controls = false;
}

function download() {
  const blob = new Blob(recordedBlobs, { type: 'video/webm' });
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
    const [width, height] = [params.width, params.height];
    canvas.width  = width;
    canvas.height = height;
    video.width  = width;
    video.height = height;
    if (params.type === 'testcard') {
        params.backgroundImage = getTestcardImage(params.width, params.height);
    } else {
        const image = new ImageData(params.width, params.height);
        const size = width * height * 4;
        for (let i = 0; i < size;) {
            const v = 127 + Math.random() * Math.random() * Math.random() * 72;
            image.data[i++] = v;
            image.data[i++] = v;
            image.data[i++] = v;
            image.data[i++] = 255; // alpha:255
        }
        params.backgroundImage = image;
    }
    const backgroundImage = params.backgroundImage;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(backgroundImage, 0, 0);
}

function drawCountDown() {
    const ticks = this.ticks; this.ticks++;
    const count = this.count;
    const params = this.params;
    const elapse = params.elapse;
    const width = canvas.width; const height = canvas.height;
    //
    const ticks_interval = 1000 / elapse;
    const count_number = 1 + count - ((ticks / ticks_interval) | 0);
    const ticks_in_count =  ticks - ticks_interval * (count - count_number + 1);
    // console.log(count_number+","+ticks_in_count);
    const ctx = canvas.getContext('2d');
    canvas.width = width; // clear
    const backgroundImage = params.backgroundImage;
    ctx.putImageData(backgroundImage, 0, 0);
    // count 範囲内でカウントダウン表示
    if ((count_number >= 0) && (count_number <= count)) {
        const center_x = width / 2; const center_y = height / 2;
        // 円を描画
        const angle_ratio = (ticks_interval - ticks_in_count) / ticks_interval;

        //
        var x = center_x; var y = center_y;
        const radius = height / 2;
        const offsetAngle = -Math.PI / 2;
        const startAngle = offsetAngle;
        let endAngle = offsetAngle - 2 * Math.PI * (angle_ratio);
        if (count_number == 0) {
            endAngle = startAngle + 2 * Math.PI;
        }
        // console.log("ratio:"+angle_ratio);
        const grad  = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, '#F8FFF0');
        grad.addColorStop(0.8, '#450');
        grad.addColorStop(1, '#420');
        //
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.moveTo(x, y);
        ctx.arc(x, y, radius, startAngle, endAngle, true);
        ctx.fill();
        // 文字を描画
        var x = center_x; var y = center_y;
        const fontSize = height / 2;
        const weight = 900;
        const text = '' + count_number;
        ctx.font = '' + weight + ' ' + fontSize + 'px Arial';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = width / 256;
        ctx.fillText(text, x, y);
        ctx.strokeText(text, x, y);
    }
    if ((count_number < 0) && (ticks_interval == (ticks_in_count + 1))) {
        stop();
    }
}
