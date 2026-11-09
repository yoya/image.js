"use strict";
/*
 * 2026/11/09- common page header (title, link to the index, drop hint)
 * 2026/11/10- file picker buttons (lib/drop.js), notification toast
 */
document.addEventListener("DOMContentLoaded", function() {
    const header = document.createElement("header");
    header.className = "pageHeader";
    const home = document.createElement("a");
    home.className = "home";
    home.href = "index.html";
    home.textContent = "image.js";
    const h1 = document.createElement("h1");
    h1.textContent = document.title.trim();
    header.append(home, h1);
    if (typeof dropFunction === "function") {
        const hint = document.createElement("span");
        hint.className = "hint";
        hint.textContent = "ファイルはドロップ・貼り付けでも読み込めます";
        header.append(hint);
    }
    document.body.prepend(header);
    if (typeof dropRenderPickers === "function") {
        dropRenderPickers();  // targets registered before the header exists
    }
});

// short message at the bottom of the screen (e.g. a file could not be read)
function pageNotify(message) {
    let toast = document.querySelector(".pageToast");
    if (! toast) {
        toast = document.createElement("div");
        toast.className = "pageToast";
        toast.setAttribute("role", "status");
        document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(pageNotify.timer);
    pageNotify.timer = setTimeout(() => toast.classList.remove("show"), 4000);
}
