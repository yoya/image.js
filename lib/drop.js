"use strict";
/*
 * 2017/01/05- (c) yoya@awm.jp
 * 2026/11/10- file picker, paste without permission, feedback on bad files
 */

// registered drop targets, used by the file picker in the page header
const dropTargets = [];

function dropNotify(message) {
    if (typeof pageNotify === "function") {
        pageNotify(message);
    } else {
        console.warn(message);
    }
}

function dropFunction(target, func, datatype) {
    // console.debug("dropFunction:", target, func, datatype);
    const handleFile = function(file) {
        const reader = new FileReader();
        reader.onerror = function() {
            dropNotify("ファイルを読み込めませんでした: " + file.name);
        };
        reader.onload = function(e) {
            const result = e.target.result;
            if (datatype !== "DataURL") {
                try {
                    func(result);
                } catch (err) {
                    console.error(err);
                    dropNotify("このファイルは処理できませんでした: " + file.name);
                }
                return;
            }
            // DataURL callers all decode it as an image: check it first,
            // so that a non-image or unsupported format is reported.
            const image = new Image();
            image.onload = function() {
                func(result);
            };
            image.onerror = function() {
                dropNotify("画像として読み込めませんでした: " + file.name);
            };
            image.src = result;
        };
        switch (datatype) {
        case "DataURL":
            reader.readAsDataURL(file);
            break;
        case "ArrayBuffer":
            reader.readAsArrayBuffer(file);
            break;
        default:
            console.error("Unknown datatype:"+datatype);
            break;
        }
    };
    dropTargets.push({ target, datatype, handleFile });
    // highlight while dragging a file over the target
    const highlight = (target === document) ? document.documentElement : target;
    let depth = 0;
    const isFileDrag = (e) => e.dataTransfer &&
          Array.from(e.dataTransfer.types || []).includes("Files");
    target.addEventListener("dragenter", (e) => {
        if (isFileDrag(e)) {
            depth++;
            highlight.classList.add("dropActive");
        }
    }, false);
    target.addEventListener("dragleave", (e) => {
        if (isFileDrag(e) && (--depth <= 0)) {
            depth = 0;
            highlight.classList.remove("dropActive");
        }
    }, false);
    target.addEventListener("dragover" , (e) => {
        e.preventDefault();
    }, false);
    target.addEventListener("drop"     , function(e) {
        e.preventDefault();
        depth = 0;
        highlight.classList.remove("dropActive");
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, false);
    // paste: use the event's own clipboard data (no permission prompt,
    // any image type). leave text paste to text inputs as is.
    target.addEventListener("paste", function(e) {
        const files = e.clipboardData ? e.clipboardData.files : [];
        const file = Array.from(files).find(f => f.type.startsWith("image/"));
        if (! file) {
            return;
        }
        e.preventDefault();
        handleFile(file);
    }, false);
    dropRenderPickers();
}

// "choose a file" buttons in the page header (for touch devices etc.)
function dropRenderPickers() {
    const header = document.querySelector(".pageHeader");
    if ((! header) || (dropTargets.length === 0)) {
        return;
    }
    let box = header.querySelector(".filePickers");
    if (! box) {
        box = document.createElement("span");
        box.className = "filePickers";
        const hint = header.querySelector(".hint");
        header.insertBefore(box, hint);
    }
    box.replaceChildren();
    const multi = dropTargets.length > 1;
    dropTargets.forEach(function(entry, i) {
        const input = document.createElement("input");
        input.type = "file";
        input.hidden = true;
        if (entry.datatype === "DataURL") {
            input.accept = "image/*";
        }
        input.addEventListener("change", function() {
            if (input.files[0]) {
                entry.handleFile(input.files[0]);
            }
            input.value = "";  // allow choosing the same file again
        });
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filePick";
        button.textContent = multi ? ("画像" + (i + 1) + "を選ぶ") :
            ((entry.datatype === "DataURL") ? "画像を選ぶ" : "ファイルを選ぶ");
        button.addEventListener("click", () => input.click());
        box.append(button, input);
    });
}
