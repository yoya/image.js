"use strict";

/*
  2017/01/05- yoya@awm.jp
*/

function dropFunction(target, func, datatype) {
    // console.debug("dropFunction");
    var cancelEvent = function(e) {
	e.preventDefault();
	e.stopPropagation();
	return false;
    };
    target.addEventListener("dragover" , cancelEvent, false);
    target.addEventListener("dragenter", cancelEvent, false);
    target.addEventListener("drop"     , function(e) {
        e.preventDefault();
	var file = e.dataTransfer.files[0];
	var reader = new FileReader();
        reader.onload = function(e) {
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
        return false;
    }, false);
}
