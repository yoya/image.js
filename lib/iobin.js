"use strict";
/*
 * 2017/05/08- (c) yoya@awm.jp
 */

class IOBin {
    constructor(buf, byteOrder) {
	this.buf = buf;
	this.byteData = new Uint8Array(buf);
	this.byteLength = this.byteData.length;
	this.byteOffset = 0;
	if (byteOrder !== undefined) {
	    this.setByteOrder(byteOrder);
	}
	this.ContextStack = []; // save, restore
    }
    getByteOrder() {
	return this.byteOrder;
    }
    setByteOrder(byteOrder) {
	var proto = this.__proto__;
	// var proto = this;
	this.byteOrder = byteOrder;
	switch (byteOrder) {
	case "B": // Big Endian
	    proto.getUI16 = proto.getUI16BE;
	    proto.getUI32 = proto.getUI32BE;
	    break;
	case "L": // Little Endian
	    proto.getUI16 = proto.getUI16LE;
	    proto.getUI32 = proto.getUI32LE;
	    break;
	default:
	    console.error("Illegal byteOrder:"+byteOrder)
	    break;
	}
    }
    save() {
	var context = {offset:this.byteOffset,
		       byteOrder:this.byteOrder};
	this.ContextStack.push(context);
    }
    restore() {
	var context = this.ContextStack.pop();
	this.byteOffset = context.offset;
	this.setByteOrder(context.byteOrder);
    }
    getByteOffset() {
	return this.byteOffset;
    }
    hasNext(nByte) {
	if (this.byteLength < this.byteOffset + nByte) {
	    return false;
	}
	return true;
    }
    readBytes(offset, nByte) {
	var nextOffset = offset + nByte;
	var b = this.byteData.slice(offset, nextOffset);
	return b;
    }
    peekBytes(nByte) {
	var nextOffset = this.byteOffset + nByte;
	var b = this.byteData.slice(this.byteOffset, nextOffset);
	return b;
    }
    peekString(nByte) {
	var b = this.peekBytes(nByte);
	return String.fromCharCode.apply(null, b);
    }
    seekToCode(c) {
	var byteData = this.byteData;
	while (byteData[this.byteOffset++] !== c) {
	    if (this.byteLength < this.byteOffset) {
		return false;
	    }
	}
	return true;
    }
    getBytes(nByte) {
	var nextOffset = this.byteOffset + nByte;
	var b = this.byteData.slice(this.byteOffset, nextOffset);
	this.byteOffset = nextOffset;
	return b;
    }
    getString(nByte) {
	var b = this.getBytes(nByte);
	return String.fromCharCode.apply(null, b);
    }
    peekUI8() {
	return this.byteData[this.byteOffset];
    }
    getUI8() {
	return this.byteData[this.byteOffset++];
    }
    getUI16() {
	throw "getUI16: must be set ByteOrder";
    }
    getUI16BE() {
	return (this.byteData[this.byteOffset++] * 0x100)
	    + this.byteData[this.byteOffset++];
    }
    getUI16LE() {
	return this.byteData[this.byteOffset++]
	    + (this.byteData[this.byteOffset++] * 0x100);
    }
    getUI32() {
    	throw "getUI32: must be set ByteOrder";
    }
    getUI32BE() {
	return (this.byteData[this.byteOffset++] * 0x1000000)
	    + (this.byteData[this.byteOffset++] * 0x10000)
	    + (this.byteData[this.byteOffset++] * 0x100)
	    + this.byteData[this.byteOffset++];
    }
    getUI32LE() {
	return this.byteData[this.byteOffset++]
	    + (this.byteData[this.byteOffset++] * 0x100)
	    + (this.byteData[this.byteOffset++] * 0x10000)
	    + (this.byteData[this.byteOffset++] * 0x1000000);
    }
}
