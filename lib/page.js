"use strict";
/*
 * 2026/11/09- common page header (title, link to the index, drop hint)
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
        hint.textContent = "画像ファイルをページにドロップすると処理します";
        header.append(hint);
    }
    document.body.prepend(header);
});
