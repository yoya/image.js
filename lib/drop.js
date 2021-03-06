"use strict";
/*
 * 2017/01/05- (c) yoya@awm.jp
 */

function IsSafari() {
    var ua = navigator.userAgent;
    var hasVersion = ua.indexOf('Version/') > -1;
    var hasChrome  = ua.indexOf('Chrome/') > -1;
    var hasSafari  = ua.indexOf('Safari/') > -1;
    return hasVersion && (! hasChrome) && hasSafari;
}

function dropFunction(target, func, datatype) {
    // console.debug("dropFunction:", target, func, datatype);
    var cancelEvent = function(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
    };
    var fileReadEvent = function(file, func) {
	// console.debug("fileReadEvent:", file, func);
	var reader = new FileReader();
        reader.onload = function(e) {
	    // console.debug("reader.onload", e, e.target.result);
	    func(e.target.result);
        }
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
    }
    target.addEventListener("dragover" , cancelEvent, false);
    target.addEventListener("dragenter", cancelEvent, false);
    target.addEventListener("drop"     , function(e) {
	e.preventDefault();
	e.stopPropagation();
	var file = e.dataTransfer.files[0];
	if (file) {
	    fileReadEvent(file, func);
	}
    }, false);


    if (! IsSafari()) { // Chrome, Firefox
	// ref) http://qiita.com/tatesuke/items/00de1c6be89bad2a6a72
	target.addEventListener("paste", function(e) {
	    // console.debug("paste", e);
	    e.preventDefault();
	    e.stopPropagation();
	    if (e.clipboardData.items) { // Chrome/Firefox
		var item = e.clipboardData.items[0];
		var type = item.type;
		if ((type === "file") || (type.indexOf("image/") === 0)) {
		    var file = item.getAsFile();
		    if (file) {
			fileReadEvent(file, func);
		    } else {
			console.error("getAsFile => null");
		    }
		} else { // "string" for Chrome
		    item.getAsString(function (t){
			var parser = new DOMParser();
			var doc = parser.parseFromString(t, "text/html");
			var img = doc.querySelector("img");
			var src = img.getAttribute("src");
			func(src);
		    });
		}
	    }
	}, false);
    } else { // Safari
	var editElement = document.body;
	if (target.setAttribute) {
	    editElement = target;
	} else {
            console.warn("target has no setAttribute, fallback to document body.");
        }
	editElement.setAttribute("contentEditable", "true");
	target.addEventListener("input", function(e) { // Safari
	    e.preventDefault();
	    e.stopPropagation();
	    var elem = e.target;
	    var imgElem = elem.querySelector("img");
	    if (imgElem) {
		var base64 = imgElem.src;
		imgElem.parentNode.removeChild(imgElem);
		func(base64);
	    }
	    if (e.inputType !== "historyUndo") {
		document.execCommand("undo", false, null);
	    }
	}, false);
    }

    // no pastable environment.
    var input = document.createElement("input");
    input.setAttribute("type", "file");
    // input.setAttribute("style", "visibility:hidden;");
    var body = document.body;
    body.appendChild(input);
    input.addEventListener("change", function(e) {
        var file = e.target.files[0];
        fileReadEvent(file, func);
    });
}
