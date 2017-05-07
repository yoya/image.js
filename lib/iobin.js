"use strict";
/*
 * 2017/05/08- (c) yoya@awm.jp
 */

class IOBin {
    constructor (buf, byteOrder) {
	this.buf = buf;
	this.byteData = new Uint8Array(buf);
	this.byteLength = this.byteData.length;
	this.byteOffset = 0;
	if (byteOrder !== undefined) {
	    this.setByteOrder(byteOrder);
	}
    }
    getByteOrder() {
	return this.byteOrder;
    }
    setByteOrder(byteOrder) {
	this.byteOrder = byteOrder;
	var proto = this.__proto__;
	switch (byteOrder) {
	case "M":
	    proto.getUI16 = proto.getUI16BE;
	    proto.getUI32 = proto.getUI32BE;
	    break;
	case "I":
	    proto.getUI16 = proto.getUI16LE;
	    proto.getUI32 = proto.getUI32LE;
	    break;
	default:
	    console.error("Illegal byteOrder:"+byteOrder)
	    break;
	}
    }
    extendByteDataIfDontHaveEnough(nByte) {
	var nextOffset =  this.byteOffset + nByte;
	if (this.byteLength < nextOffset) {
	    if (this.byte.length < nextOffset) {
		var buf = ArrayBuffer.transfer(this.buf, nextOffset);
		this.buf = buf;
		this.byte = new Uint8Array(buf);
	    }
	    this.byteLength = nextOffset;
	}
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
    getUI8() {
	return this.byteData[this.dataOffset++];
    }
    getUI16() {
	throw "getUI16: must be set ByteOrder";
    }
    getUI16BE() {
	return (this.byteData[this.dataOffset++] * 0x100)
	    + this.byteData[this.dataOffset++];
    }
    getUI16LE() {
	return this.byteData[this.dataOffset++]
	    + (this.byteData[this.dataOffset++] * 0x100);
    }
    getUI32() {
    	throw "getUI32: must be set ByteOrder";
    }
    getUI32BE() {
	return (this.byteData[this.dataOffset++] * 0x1000000)
	    + (this.byteData[this.dataOffset++] * 0x10000)
	    + (this.byteData[this.dataOffset++] * 0x100)
	    + this.byteData[this.dataOffset++];
    }
    getUI32LE() {
	return this.byteData[this.dataOffset++]
	    + (this.byteData[this.dataOffset++] * 0x100)
	    + (this.byteData[this.dataOffset++] * 0x10000)
	    + (this.byteData[this.dataOffset++] * 0x1000000);
    }
}
