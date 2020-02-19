"use strict";

/*
  2020/02/19- yoya@awm.jp
  https://sourceforge.net/p/giflib/code/
*/

class IO_LZW {
    constructor(LZWcodeArr) {
        this.LZ_MAX_CODE  = 4095;
        this.NO_SUCH_CODE = 4098;  /* Impossible code, to signal empty. */
        this.LZ_BITS      = 12;
        //
        this._dataArr = LZWcodeArr;  // Array of Uint8Array
        this._data    = LZWcodeArr[0];
        this._dataArrIndex = 0;
        this._dataOffset = 0;
    }
    DGifBufferedInput() {
        while (this._data.length <= this._dataOffset) {
            this._dataArrIndex++;
            if (this._dataArrIndex >= this._dataArr.length) {
                throw "D_GIF_ERR_READ_FAILED";
            }
            this._data = this._dataArr[this._dataArrIndex];
            this._dataOffset = 0;
        }
        return this._data[this._dataOffset++];
    }
    DGifSetupDecompress(codeBits) {
        this.BitsPerPixel = codeBits;
        this.ClearCode = (1 << this.BitsPerPixel);
        this.EOFCode   = this.ClearCode + 1;
        this.RunningCode = this.EOFCode + 1;
        this.RunningBits = this.BitsPerPixel + 1;
        this.MaxCode1 = 1 << this.RunningBits;
        this.StackPtr = 0;
        this.LastCode = this.NO_SUCH_CODE;
        this.CrntShiftState = 0;
        this.CrntShiftDWord = 0;
        this.Stack  = new Uint8Array(this.LZ_MAX_CODE);
        this.Suffix = new Uint8Array(this.LZ_MAX_CODE + 1);
        this.Prefix = new Uint16Array(this.LZ_MAX_CODE + 1);
        for (let i = 0; i <= this.LZ_MAX_CODE; i++) {
            this.Prefix[i] = this.NO_SUCH_CODE;
        }
    }
    DGifDecompressInput() {
        const CodeMasks = [ 0x0000, 0x0001, 0x0003, 0x0007,
                            0x000f, 0x001f, 0x003f, 0x007f,
                            0x00ff, 0x01ff, 0x03ff, 0x07ff,
                            0x0fff ];
        if (this.RunningBits > this.LZ_BITS) {
            throw "D_GIF_ERR_IMAGE_DEFECT";
        }
        while (this.CrntShiftState < this.RunningBits) {
            let NextByte = this.DGifBufferedInput();
            this.CrntShiftDWord |= NextByte << this.CrntShiftState;
            this.CrntShiftState += 8;
        }
        let Code = this.CrntShiftDWord & CodeMasks[this.RunningBits];
        this.CrntShiftDWord >>= this.RunningBits;
        this.CrntShiftState -= this.RunningBits;
        if (this.RunningCode < this.LZ_MAX_CODE + 2 &&
            ++this.RunningCode > this.MaxCode1 &&
            this.RunningBits < this.LZ_BITS) {
            this.MaxCode1 <<= 1;
            this.RunningBits++;
        }
        return Code;
    }
    DGifGetPrefixChar(Prefix, Code, ClearCode) {
        let i = 0;
        while (Code > ClearCode && i++ <= this.LZ_MAX_CODE) {
            if (Code > this.LZ_MAX_CODE) {
                return this.NO_SUCH_CODE;
            }
            Code = Prefix[Code];
        }
        return Code;
    }
    DGifDecompressLine(codeBits, Indices) {
        // DGifBufferedInput initialize
        let Line = Indices;
        let LineLen = Indices.length;
        //
        let i = 0;
        let CrntCode, EOFCode, ClearCode, CrntPrefix, LastCode, StackPtr;
        let Stack, Suffix;  // Uint8Array
        let Prefix;         // Uint16Array
        this.DGifSetupDecompress(codeBits);
        StackPtr  = this.StackPtr;
        Prefix    = this.Prefix;
        Suffix    = this.Suffix;
        Stack     = this.Stack;
        EOFCode   = this.EOFCode;
        ClearCode = this.ClearCode;
        LastCode  = this.LastCode;
        
        if (StackPtr > this.LZ_MAX_CODE) {
            throw "StackPtr:StackPtr > this.LZ_MAX_CODE:"+this.LZ_MAX_CODE;
        }
        while (i < LineLen) {
            let CrntCode = this.DGifDecompressInput();
            if (CrntCode == EOFCode) {
                throw "D_GIF_ERR_EOF_TOO_SOON";
            } else if (CrntCode == ClearCode) {
                for (let j = 0; j <= this.LZ_MAX_CODE; j++) {
                    Prefix[j] = this.NO_SUCH_CODE;
                }
                this.RunningCode = this.EOFCode + 1;
                this.RunningBits = this.BitsPerPixel + 1;
                this.MaxCode1 = 1 << this.RunningBits;
                LastCode = this.LastCode = this.NO_SUCH_CODE;
            } else {
                if (CrntCode < ClearCode) {
                    console.debug("output => CrntCode:"+CrntCode);
                    Line[i++] = CrntCode;
                } else {
                    if (Prefix[CrntCode] === this.NO_SUCH_CODE) {
                        CrntPrefix = LastCode;
                        if (CrntCode == this.RunningCode - 2) {
                            Suffix[this.RunningCode - 2] =
                                     Stack[StackPtr++] = this.DGifGetPrefixChar(Prefix, LastCode, ClearCode);
                        } else {
                            Suffix[this.RunningCode - 2] =
                                    Stack[StackPtr++] = this.DGifGetPrefixChar(Prefix, CrntCode, ClearCode);
                        }
                    }  else {
                        CrntPrefix = CrntCode;
                    }
                    while (StackPtr < this.LZ_MAX_CODE &&
                           CrntPrefix > ClearCode && CrntPrefix <= this.LZ_MAX_CODE) {
                        Stack[StackPtr++] = Suffix[CrntPrefix];
                        CrntPrefix = Prefix[CrntPrefix];
                    }
                    if (StackPtr >= this.LZ_MAX_CODE || CrntPrefix > this.LZ_MAX_CODE) {
                        throw "D_GIF_ERR_IMAGE_DEFECT: StackPtr:StackPtr >= LZ_MAX_CODE:"+this.LZ_MAX_CODE+" || CrntPrefix:CrntPrefix > LZ_MAX_CODE:"+this.LZ_MAX_CODE;
                    }
                    Stack[StackPtr++] = CrntPrefix;
                    console.debug("CrntCode:"+CrntCode);
                    while (StackPtr != 0 && i < LineLen) {
                        Line[i++] = Stack[--StackPtr];
                        console.debug("output => Stack["+StackPtr+"]:"+Stack[StackPtr]);
                    }
                }
                if (LastCode != this.NO_SUCH_CODE && this.RunningCode - 2 < (this.LZ_MAX_CODE+1) && Prefix[this.RunningCode - 2] == this.NO_SUCH_CODE) {
                    Prefix[this.RunningCode - 2] = LastCode;
                    if (CrntCode == this.RunningCode - 2) {
                        Suffix[this.RunningCode - 2] =
                            this.DGifGetPrefixChar(Prefix, LastCode, ClearCode);
                    } else {
                        Suffix[this.RunningCode - 2] =
                            this.DGifGetPrefixChar(Prefix, CrntCode, ClearCode);
                    }
                }
            }
            LastCode = CrntCode;
        }
    }
}
