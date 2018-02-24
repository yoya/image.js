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
	    this.readUint64 = this.readUint64BigEndian;
	    this.readUintN = this.readUintNBigEndian;
	    break;
	case "II": case "LittleEndian":
	    this.readUint16 = this.readUint16LittleEndian;
	    this.readUint32 = this.readUint32LittleEndian;
	    this.readUint64 = this.readUint64LittleEndian;
	    this.readUintN = this.readUintNLittleEndian;
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
	if (n < 100*1024) { // macOS+Chrome: 122KB OK, 123KB NG
	    return String.fromCharCode.apply(null, arr);
	} else {
	    var s = [];
	    for (var i = 0  ; i < n ; i++) {
		s.push(String.fromCharCode(arr[i]));
	    }
	    return s.join('');
	}
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
    getUint64() {
	var v = this.readUint64(this.arr, this.cursol);
	this.cursol += 8;
	return v;
    }
    getSint64() {
	var v = this.readSint64(this.arr, this.cursol);
	this.cursol += 8;
	return v;
    }
    getUintN(nBytes) {
	var v = this.readUintN(this.arr, this.cursol, nBytes);
	this.cursol += nBytes;
	return v;
    }
    getSintN(nBytes) {
	var v = this.readSintN(this.arr, this.cursol, nBytes);
	this.cursol += nBytes;
	return v;
    }
    getUIBCD8() {
	var v = this.readUIBCD8(this.arr, this.cursol)
	this.cursol ++;
	return v;
    }
    readSubArray(arr, offset, n) {
	return arr.subarray(offset, offset + n);
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
    readSint64(arr, offset) {
	var v = this.readUint64(arr, offset);
	return (v < 0x8000000000000000)? v :(v - 0x10000000000000000);
    }
    readSintN(arr, offset, nBytes) {
	var v = this.readUintN(arr, offset, nBytes);
	var range_half = 1 << (8 * nBytes - 1)
	var range = 1 << (8 * nBytes)
	return (v < range_half)? v :(v - range);
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
    readUint64BigEndian(arr, offset) {
	return ((((((arr[offset]*0x100 + arr[offset+1])*0x100 + arr[offset+2])*0x100 + arr[offset+3])*0x100 + arr[offset+4])*0x100 + arr[offset+5])*0x100 + arr[offset+6])*0x100 + arr[offset+7];
    }
    readUintNBigEndian(arr, offset, nBytes) {
	var v = 0;
	for (var i = 0 ; i < nBytes ; i++) {
	    v = (v*0x100) + arr[i];
	}
	return v;
    }
    // Little Endian
    readUint16LittleEndian(arr, offset) {
	return arr[offset] + 0x100 * arr[offset+1];
    }
    readUint32LittleEndian(arr, offset) {
	return arr[offset] + 0x100*(arr[offset+1] + 0x100*(arr[offset+2] + 0x100*arr[offset+3]));
    }
    readUint64LittleEndian(arr, offset) {
	return arr[offset] + 0x100*(arr[offset+1] + 0x100*(arr[offset+2] + 0x100*(arr[offset+3] + 0x100*(arr[offset+4] + 0x100*(arr[offset+5] + 0x100*(arr[offset+6] + 0x100*arr[offset+7]))))));
    }
    readUintNLittleEndian(arr, offset, nBytes) {
	var v = 0, n = nBytes;
	while (n--) {
	    v = (v*0x100) + arr[n];
	}
	return v;
    }
}
