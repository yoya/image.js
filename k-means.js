"use strict";
/*
 * 2018/06/05- (c) yoya@awm.jp
 */

document.addEventListener("DOMContentLoaded", function(event) {
    main();
});

var kMeansContext = function(canvas, nPoints, nCenterPoints) {
    this.nPoints = nPoints;
    this.nCenterPoints = nCenterPoints;
    this.points = null;
    this.centerPoints = null;
    this.centerPrevPoints = null;
    this.centerInitPoints = null;
    //
    this.canvas = canvas;
    this.status = 0; // 0:init: -1:stop
    this.progress = 0;
    this.timerId = null;
}

var Point = function(x, y, centerIndex) {
    this.x = x;
    this.y = y;
    this.centerIndex = null;
}
var canvas = document.getElementById("canvas");

var kmc = null;

function main() {
    console.debug("main");
    canvas.style.background = "black";
    bindFunction({ "restartButton":null,
		   "resetButton":null,
		   "nPointsRange":"nPointsText",
		   "nCenterPointsRange":"nCenterPointsText" },
		 function(target) {
		     if (target.id !== "restartButton") {
			 reset();
		     } else {
			 revert();
		     }
		     restart();
		 });
    reset();
    restart();
}

function reset() {
    var nPoints = parseFloat(document.getElementById("nPointsRange").value);
    var nCenterPoints = parseFloat(document.getElementById("nCenterPointsRange").value);
    if (kmc) {
	kmc.status = -1; // stop
	kmc = null;
    }
    kmc = new kMeansContext(canvas, nPoints, nCenterPoints);
    kMeansSetup(kmc);
}

function revert(){
    for (var i = 0, n = kmc.nPoints ; i < n ; i++) {
	kmc.points[i].centerIndex = null;
    }
    for (var i = 0, n = kmc.nCenterPoints ; i < n ; i++) {
	kmc.centerPoints[i].x = kmc.centerInitPoints[i].x;
	kmc.centerPoints[i].y = kmc.centerInitPoints[i].y;
	kmc.centerPrevPoints[i].x = kmc.centerInitPoints[i].x;
	kmc.centerPrevPoints[i].y = kmc.centerInitPoints[i].y;
    }
    if (kmc.status <= 0) {
	kmc.timerId = setTimeout(kMeansAnimation.bind(kmc), 100);
    }
    kmc.status = 1;
}

function restart() {
    if (kmc.status <= 0) { // 0 or -1
	kmc.status = 1;
	kmc.timerId = setTimeout(kMeansAnimation.bind(kmc), 100);
    }
    kMeansDrawPoints(kmc);
}

function kMeansSetup(kmc) {
    var width = kmc.canvas.width;
    var height = kmc.canvas.height;
    var points = [];
    for (var i = 0, n = kmc.nPoints ; i < n ; i++) {
	var x = Math.random() * width;
	var y = Math.random() * height;
	var centerIndex = (Math.random() * kmc.nCenterPoints) | 0;
	points.push(new Point(x, y, centerIndex));
    }
    kmc.points = points;
    var centerPoints = [];
    var centerPrevPoints = [];
    var centerInitPoints = [];
    for (var i = 0, n = kmc.nCenterPoints ; i < n ; i++) {
	var x = Math.random() * width;
	var y = Math.random() * height;
	centerPoints.push(new Point(x, y, i));
	centerPrevPoints.push(new Point(x, y, i));
	centerInitPoints.push(new Point(x, y, i));
    }
    kmc.centerPoints = centerPoints;
    kmc.centerPrevPoints = centerPrevPoints;
    kmc.centerInitPoints = centerInitPoints;
}

function kMeansDrawPoints(kmc) {
    var canvas = kmc.canvas;
    canvas.width = canvas.width;
    var ctx = canvas.getContext("2d");
    for (var i = 0, n = kmc.nPoints ; i < n ; i++) {
	var point = kmc.points[i];
	var x = point.x;
	var y = point.y;
	var centerIndex = point.centerIndex;
	ctx.beginPath();
	if (centerIndex === null) {
	    ctx.strokeStyle = "hsl(0, 0%, 80%)";
	    ctx.fillStyle = "hsl(0, 0%, 80%, 50%)";
	} else {
	    var hue = 360 * centerIndex / kmc.nCenterPoints;
	    ctx.strokeStyle = "hsl("+hue+", 100%, 80%)";
	    ctx.fillStyle = "hsl("+hue+", 100%, 80%, 50%)";
	}
	ctx.arc(x, y, 5, 0, 2*Math.PI , false);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();
	if (centerIndex !== null) {
	    // console.log("centerIndex !== null");
	    var centerPoint = kmc.centerPoints[centerIndex];
	    var hue = 360 * centerIndex / kmc.nCenterPoints;
	    ctx.save();
	    ctx.beginPath();
	    ctx.strokeStyle = "hsla("+hue+", 100%, 80%, 50%)";
	    if ((kmc.status === 1) &&
		(i === kmc.progress)) {
		ctx.lineWidth += 2;
	    }
	    ctx.moveTo(x, y);
	    ctx.lineTo(centerPoint.x, centerPoint.y);
	    ctx.stroke();
	    ctx.closePath();
	    ctx.restore();
	}
    }
    if (kmc.centerPoints) {
	for (var i = 0, n = kmc.nCenterPoints ; i < n ; i++) {
	    var hue = 360 * i / kmc.nCenterPoints;
	    var point = kmc.centerPoints[i];
	    var x = point.x;
	    var y = point.y;
	    if ((kmc.status === 3) &&
		(i <= kmc.progress)) {
		var prev = kmc.centerPrevPoints[i];
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = "hsla("+hue+", 100%, 80%, 50%)";
		ctx.fillStyle = "hsla("+hue+", 100%, 80%, 20%)";
		ctx.arc(prev.x, prev.y, 10, 0, 2*Math.PI , false);
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
		//
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = "hsla("+hue+", 100%, 80%, 50%)";
		ctx.lineWidth += 10;
		ctx.lineCap = "round";
		ctx.moveTo(prev.x, prev.y);
		ctx.lineTo(x, y);
		ctx.stroke();
		ctx.closePath();
		ctx.restore();
	    }
	    ctx.save();
	    ctx.beginPath();
	    ctx.strokeStyle = "hsl("+hue+", 100%, 80%)";
	    ctx.fillStyle = "hsla("+hue+", 100%, 80%, 20%)";
	    ctx.lineWidth += 1;
	    if (((kmc.status === 3) && (i <= kmc.progress)) ||
		(kmc.status === 4)) {
		ctx.lineWidth += 2;
	    }
	    ctx.arc(x, y, 10, 0, 2*Math.PI , false);
	    ctx.fill();
	    ctx.stroke();
	    ctx.closePath();
	    ctx.restore();
	}
    }
}

function kMeansAnimation() {
    var kmc = this;
    // console.debug(kmc);
    if (kmc.status < 0) { // stop
	return ;
    }
    // console.debug(kmc.status);
    var elapse = 1000;
    switch (kmc.status) {
    case 0: // initial
	return ;
	break;
    case 1: // neighbor point search
	kMeans_1(kmc);
	//elapse = 100;
	elapse = 1000 * 5 / kmc.nPoints;
	if (elapse > 200) {
	    elapse = 200;
	}
	break;
    case 2: // rest
	break;
    case 3: // gravity center calculation
	kMeans_3(kmc);
	break;
    case 4: // rest & clear centerindex
	kMeans_4(kmc);
	break;
    default:
	console.error("illegal status:"+kmc.status);
	return ; // stop
	break;
    }
    kMeansDrawPoints(kmc);
    switch (kmc.status) {
    case 1:
	kmc.progress ++;
	if (kmc.progress < kmc.nPoints) {
	    ;
	} else {
	    kmc.status = 2;
	    kmc.progress = 0;
	}
	break;
    case 2:
	kmc.status = 3;
	break;
    case 3:
	kmc.progress ++;
	if (kmc.progress < kmc.nCenterPoints) {
	    ;
	} else {
	    kmc.status = 4;
	    kmc.progress = 0;
	}
	break;
    case 4:
	var centerModified = false;
	for (var i = 0, n = kmc.nCenterPoints ; i < n ; i++) {
	    var point = kmc.centerPoints[i];
	    var prev = kmc.centerPrevPoints[i];
	    if ((point.x != prev.x) || (point.x != prev.x)) {
		centerModified = true;
		break;
	    }
	    }
	if (centerModified) {
	    kmc.status = 1;
	    kmc.progress = 0;
	} else {
	    kmc.status = -1; // stop
	    kmc.progress = 0;
	    console.log("fine");
	    return ; // stop
	}
	break;
    }
    kmc.timerId = setTimeout(kMeansAnimation.bind(kmc), elapse);
}

function kMeans_1(kmc) { // neighbor point search
    var i = kmc.progress;
    var point = kmc.points[i];
    var x = point.x;
    var y = point.y;
    var minDistance = Number.MAX_VALUE;
    var centerIndex = null;
    for (var i2 = 0, n2 = kmc.nCenterPoints ; i2 < n2 ; i2++) {
	var centerPoint = kmc.centerPoints[i2];
	var x_diff = x - centerPoint.x;
	var y_diff = y - centerPoint.y;
	var dist = x_diff*x_diff + y_diff*y_diff;
	if (dist < minDistance) {
	    centerIndex = i2;
	    minDistance = dist;
	}
    }
    point.centerIndex = centerIndex;
}

function kMeans_3(kmc) { // gravity center calculation
    var i = kmc.progress;
    var centerPoint = kmc.centerPoints[i];
    var centerPrevPoint = kmc.centerPrevPoints[i];
    centerPrevPoint.x = centerPoint.x;
    centerPrevPoint.y = centerPoint.y;
    var xSum = 0;
    var ySum = 0;
    var nSum = 0;
    for (var i2 = 0, n2 = kmc.nPoints ; i2 < n2 ; i2++) {
	var point = kmc.points[i2];
	if (point.centerIndex === i) {
	    xSum += point.x;
	    ySum += point.y;
	    nSum ++;
	}
    }
    if (nSum > 0) {
	centerPoint.x = xSum / nSum;
	centerPoint.y = ySum / nSum;
    }
}


function kMeans_4(kmc) { // clear centerindex
    for (var i = 0, n = kmc.nPoints ; i < n ; i++) {
	kmc.points[i].centerIndex = null;
    }
}

