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
 * spinner: red, green and blue arcs chasing each other around a ring,
 * on a translucent disc so that it stays visible over any image.
 * (animation: .loadingSpin in index.css; colors follow the theme)
 * circumference of r=32: 2 * PI * 32 = 201
 */
var loading_svg =
'<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
'  <circle class="loadingDisc" cx="50" cy="50" r="48"/>' +
'  <circle class="loadingRing" cx="50" cy="50" r="32"/>' +
'  <g class="loadingSpin">' +
'    <circle class="loadingArc" cx="50" cy="50" r="32" stroke="var(--red, #e5534b)"   stroke-dashoffset="0"/>' +
'    <circle class="loadingArc" cx="50" cy="50" r="32" stroke="var(--green, #2da44e)" stroke-dashoffset="-67"/>' +
'    <circle class="loadingArc" cx="50" cy="50" r="32" stroke="var(--blue, #4a7fe0)"  stroke-dashoffset="-134"/>' +
'  </g>' +
'</svg>';
