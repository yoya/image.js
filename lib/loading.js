"use strict";
/*
 * 2017/06/25- (c) yoya@awm.jp
 * 2026/11/09- show a small icon over the canvas being processed,
 *             only when the work takes longer than LOADING_DELAY ms.
 */

const LOADING_DELAY = 300;  // ms; short work finishes without any flicker
const LOADING_FADE = 200;   // ms; keep in sync with .loadingOverlay in index.css

const loadingState = { timer: null, targets: [], overlays: [] };

function loadingTargets(target) {
    if (! target) {
        return [];
    }
    const list = (target instanceof HTMLCanvasElement) ? [target] : Array.from(target);
    return list.filter(c => c instanceof HTMLCanvasElement);
}

function loadingMakeOverlay(canvas) {
    const div = document.createElement("div");
    div.className = "loadingOverlay";
    div.innerHTML = loading_svg;
    if (canvas) {
        const r = canvas.getBoundingClientRect();
        const size = Math.round(Math.max(24, Math.min(64, Math.min(r.width, r.height) * 0.4)));
        div.style.width = div.style.height = size + "px";
        div.style.left = (r.left + window.scrollX + (r.width - size) / 2) + "px";
        div.style.top  = (r.top  + window.scrollY + (r.height - size) / 2) + "px";
    } else {  // no target canvas: small icon in the middle of the window
        div.classList.add("loadingCenter");
    }
    return div;
}

function loadingShow() {
    loadingState.timer = null;
    const targets = loadingState.targets.length ? loadingState.targets : [null];
    for (const canvas of targets) {
        const div = loadingMakeOverlay(canvas);
        document.body.append(div);
        loadingState.overlays.push(div);
        if (canvas) {
            canvas.classList.add("loadingTarget");
        }
    }
    // next frame, so that the opacity transition (fade in) runs
    requestAnimationFrame(() => {
        loadingState.overlays.forEach(div => div.classList.add("show"));
    });
}

/*
 * target: the canvas (or an array of canvases) whose content is being updated.
 *         omitted: the icon is shown in the middle of the window.
 */
function loadingStart(target) {
    const targets = loadingTargets(target);
    if (loadingState.overlays.length) {  // already visible: follow the new target
        loadingHide();
        loadingState.targets = targets;
        loadingShow();
    } else {
        loadingState.targets = targets;
        if (loadingState.timer === null) {
            loadingState.timer = setTimeout(loadingShow, LOADING_DELAY);
        }
    }
    return loadingState;
}

function loadingHide() {
    for (const div of loadingState.overlays) {
        div.classList.remove("show");  // fade out, then remove
        setTimeout(() => div.remove(), LOADING_FADE);
    }
    loadingState.overlays = [];
    for (const canvas of loadingState.targets) {
        canvas.classList.remove("loadingTarget");
    }
}

function loadingEnd() {
    if (loadingState.timer !== null) {
        clearTimeout(loadingState.timer);
        loadingState.timer = null;
    }
    loadingHide();
    loadingState.targets = [];
}

/*
 * pinwheel: five vanes, red, yellow, green, blue and magenta (gradient from
 * the color at the tip to a pale tint at the center, like the old RGB flower
 * icon) around a pin. the vane is asymmetric (straight leading edge, curved
 * trailing edge) and turns clockwise; it is narrowed (scale x) to fit five.
 * gradients are userSpaceOnUse, so each one rotates with its vane.
 * a white halo under the vanes and a dark edge on them keep the outline
 * clear over any image. (animation, blending, outline: .loadingOverlay in index.css)
 */
var loading_svg =
'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
'  <defs>' +
'    <linearGradient id="loadingGradR" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="50">' +
'      <stop offset="0" stop-color="#ff2a2a"/><stop offset="0.55" stop-color="#ff2a2a"/><stop offset="1" stop-color="#ffb0b0"/></linearGradient>' +
'    <linearGradient id="loadingGradY" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="50">' +
'      <stop offset="0" stop-color="#ffc81e"/><stop offset="0.55" stop-color="#ffc81e"/><stop offset="1" stop-color="#fff0b0"/></linearGradient>' +
'    <linearGradient id="loadingGradG" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="50">' +
'      <stop offset="0" stop-color="#14c83c"/><stop offset="0.55" stop-color="#14c83c"/><stop offset="1" stop-color="#b4f5c4"/></linearGradient>' +
'    <linearGradient id="loadingGradB" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="50">' +
'      <stop offset="0" stop-color="#2a5cff"/><stop offset="0.55" stop-color="#2a5cff"/><stop offset="1" stop-color="#b8c8ff"/></linearGradient>' +
'    <linearGradient id="loadingGradM" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="50">' +
'      <stop offset="0" stop-color="#e02ad2"/><stop offset="0.55" stop-color="#e02ad2"/><stop offset="1" stop-color="#f8b8f0"/></linearGradient>' +
'    <path id="loadingVanePath" d="M50 50 C53 32 52 15 54 2 C30 2 10 22 20 46 Q34 58 50 50 Z"/>' +
'  </defs>' +
'  <g class="loadingSpin">' +
'   <g class="loadingHalos">' +
'    <use class="loadingHalo" href="#loadingVanePath" transform="rotate(0 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingHalo" href="#loadingVanePath" transform="rotate(72 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingHalo" href="#loadingVanePath" transform="rotate(144 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingHalo" href="#loadingVanePath" transform="rotate(216 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingHalo" href="#loadingVanePath" transform="rotate(288 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'   </g>' +
'   <g class="loadingVanes">' +
'    <use class="loadingVane" href="#loadingVanePath" fill="url(#loadingGradR)" transform="rotate(0 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingVane" href="#loadingVanePath" fill="url(#loadingGradY)" transform="rotate(72 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingVane" href="#loadingVanePath" fill="url(#loadingGradG)" transform="rotate(144 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingVane" href="#loadingVanePath" fill="url(#loadingGradB)" transform="rotate(216 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'    <use class="loadingVane" href="#loadingVanePath" fill="url(#loadingGradM)" transform="rotate(288 50 50) translate(50 0) scale(0.66 1) translate(-50 0)"/>' +
'   </g>' +
'  </g>' +
'  <circle class="loadingPin" cx="50" cy="50" r="5"/>' +
'</svg>';
