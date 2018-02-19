"use strict";

/*
  2017/01/11- yoya@awm.jp
*/

class Binary {
    constructor(byteOrder, arr) {
	this.setByteOrder(byteOrder);
	this.arr = arr;
	this.cursol = 0;
    }
    setByteOrder(byteOrder) {
	switch(byteOrder) {
	case "MM": case "BigEndian":
	    this.readUint16 = this.readUint16BigEndian;
	    this.readUint32 = this.readUint32BigEndian;
	    break;
	case "II": case "LittleEndian":
	    this.readUint16 = this.readUint16LittleEndian;
	    this.readUint32 = this.readUint32LittleEndian;
	}
    };
    setCursol(cursol) {
	this.cursol = cursol;
    }
    //
    getSubArray(n) {
	var arr = this.arr.subarray(this.cursol, this.cursol + n);
	this.cursol += n;
	return arr
    }
    getText(n) {
	var arr = this.getSubArray(n);
	return String.fromCharCode.apply(null, arr);
    }
    getUint8() {
	var v = this.arr[this.cursol];
	this.cursol ++;
	return v;
    }
    getSint8() {
	var v = this.arr[this.cursol];
	this.cursol ++;
	return (v < 0x80)? v :(v - 0x100);
    }
    getUint16() {
	var v = this.readUint16(this.arr, this.cursol);
	this.cursol += 2;
	return v;
    }
    getSint16() {
	var v = this.readSint16(this.arr, this.cursol);
	this.cursol += 4;
	return v;
    }
    getUint32() {
	var v = this.readUint32(this.arr, this.cursol);
	this.cursol += 4;
	return v;
    }
    getSint32() {
	var v = this.readSint32(this.arr, this.cursol);
	this.cursol += 4;
	return v;
    }
    getUIBCD8() {
	var v = this.readUIBCD8(this.arr, this.cursol)
	this.cursol ++;
	return v;
    }
    readSubArray(arr, offset, n) {
	return this.arr.subarray(offset, offset + n);
    }
    readText(arr, offset, n) {
	var a = this.readSubArray(arr, offset, n);
	return String.fromCharCode.apply(null, a);
    }
    readSint16(arr, offset) {
	var v = this.readUint16(arr, offset);
	return (v < 0x8000)? v :(v - 0x10000);
    }
    readSint32(arr, offset) {
	var v = this.readUint32(arr, offset);
	return (v < 0x80000000)? v :(v - 0x100000000);
    }
    readFP2Dot30(arr, offset) {
	return this.readUint32(arr, offset) / 0x40000000;
    }
    readUIBCD8(arr, offset) {
	var v = arr[offset];
        return (v >> 4) * 10 + (v & 0x0f);
    }
    // Byte Order Processor
    readUint16BigEndian(arr, offset) {
	return arr[offset]*0x100 + arr[offset+1];
    }
    readUint32BigEndian(arr, offset) {
	return ((arr[offset]*0x100 + arr[offset+1])*0x100 + arr[offset+2])*0x100 + arr[offset+3];
    }
    // Little Endian
    readUint16LittleEndian(arr, offset) {
	return arr[offset] + 0x100 * arr[offset+1];
    }
    readUint32LittleEndian(arr, offset) {
	return arr[offset] + 0x100*(arr[offset+1] + 0x100*(arr[offset+2] + 0x100*arr[offset+3]));
    }
}

