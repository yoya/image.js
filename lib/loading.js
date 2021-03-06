"use strict";
/*
 * 2017/06/25- (c) yoya@awm.jp
 */

function loadingStart() {
    var div = document.getElementById("loading");
    if (div === null) {
	var body = document.body;
	var div = document.createElement("div");
	div.id = "loading";
	div.innerHTML = loading_svg;
	div.style.zIndex = -1;
	div.style.position = "absolute";
	div.style.pointerEvents = "none";
	body.insertBefore(div, body.firstChild)
    }
    div.style.display = "block";
    return div;
}

function loadingEnd(div) {
/*
    if (! div) {
	div = document.getElementById("loading");
    }
*/
    if (div) {
	div.style.display = "none";
    }
}

var loading_svg =
'<svg viewBox="0 0 100 100" width="300" height="300" \
     xmlns="http://www.w3.org/2000/svg" \
     xmlns:xlink="http://www.w3.org/1999/xlink"> \
  <defs> \
    <linearGradient id="gradRC" gradientUnits="userSpaceOnUse" \
		    x1="0" x2="0" y1="0" y2="100"> \
      <stop offset="0" stop-color="#f00"> </stop> \
      <stop offset="0.5" stop-color="#bee"> </stop> \
      <stop offset="1" stop-color="#0dd"> </stop> \
    </linearGradient> \
    <linearGradient id="gradGM" gradientUnits="userSpaceOnUse" \
		    x1="0" x2="0" y1="0" y2="100"> \
      <stop offset="0" stop-color="#0e0"> </stop> \
      <stop offset="0.5" stop-color="#ebe"> </stop> \
      <stop offset="1" stop-color="#d0d"> </stop> \
    </linearGradient> \
    <linearGradient id="gradBY" gradientUnits="userSpaceOnUse" \
		    x1="0" x2="0" y1="0" y2="100"> \
      <stop offset="0" stop-color="#44f"> </stop> \
      <stop offset="0.5" stop-color="#eeb"> </stop> \
      <stop offset="1" stop-color="#dd0"> </stop> \
    </linearGradient> \
    <ellipse id="rod" cx="50" cy="50" rx="20" ry="50" style="mix-blend-mode:darken;"> </ellipse> \
  </defs> \
  <g style="isolation:auto"> \
    <use xlink:href="#rod" fill="url(#gradRC)"> \
      <animateTransform \
	  attributeName="transform" attributeType="XML" \
	  type="rotate" from="0 50,50" to="360 50,50" \
	  dur="2s" repeatCount="indefinite" /> \
    </use> \
    <use xlink:href="#rod" fill="url(#gradGM)"> \
      <animateTransform \
	  attributeName="transform" attributeType="XML" \
	  type="rotate" from="120 50,50" to="480 50,50" \
	  dur="2s" repeatCount="indefinite" /> \
    </use> \
    <use xlink:href="#rod" fill="url(#gradBY)"> \
      <animateTransform \
	  attributeName="transform" attributeType="XML" \
	  type="rotate" from="240 50,50" to="600 50,50" \
	  dur="2s" repeatCount="indefinite" /> \
    </use> \
  </g> \
</svg> \
';
