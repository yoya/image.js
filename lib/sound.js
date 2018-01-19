"use strict";
/*
 * 2018/01/20- (c) yoya@awm.jp
 */

var audioContext = null;

function getAudioContext() {
    if (audioContext) {
	return audioContext;
    }
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    return audioContext;
}

var musicScaleTable = null;

function getScaleTable() {
    if (musicScaleTable) {
	return musicScaleTable;
    }
    musicScaleTable = new Float32Array(128);
    var root12 = Math.pow(2, 1/12);
    musicScaleTable[69] = 440; // [Hz] A4
    for (var i = 69 ; i < 127; i++) {
        musicScaleTable[i + 1] = musicScaleTable[i] * root12;
    }
    for (var i = 69 ; 0 < i; i--) {
        musicScaleTable[i - 1] = musicScaleTable[i] / root12;
    }
    return musicScaleTable;
}

function noteOn(tone, period) {
    var ctx = getAudioContext();
    var musicScaleTable = getScaleTable();
    var freq = musicScaleTable[tone];
    var gain = ctx.createGain();
    var startTime = ctx.currentTime;
    var endTime = ctx.currentTime + period;
    gain.gain.linearRampToValueAtTime(0.5, startTime);
    gain.gain.linearRampToValueAtTime(0.0, endTime);
    gain.connect(ctx.destination);
    var osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(0);
    setInterval(function() {
	osc.stop(endTime);
    }, period);
}    
