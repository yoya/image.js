/*
  2017/01/14- yoya@awm.jp
  ref)
  - https://msdn.microsoft.com/en-us/library/dd183391(v=vs.85).aspx
*/

import { Binary } from './binary':
import { Utils } from './utils';

export class IO_BMP {
    static signature() {
        return [0x42, 0x4d]; // "BM"
    }

    static verifySig(arr) {
        const sig = this.signature();

        if (arr.length < sig.length) {
            return false; // too short
        }

        for (let i = 0, n = sig.length; i < n; i++) {
            if (arr[i] !== sig[i]) {
                return false; // different value found
            }
        }

        return true; // completely matching
    }

    constructor() {
        this.data = null;
        this.binary = new Binary('LittleEndian');
    }

    parse(arr) {
        this.data = arr;

        let chunk = null;

        // https://msdn.microsoft.com/en-us/library/dd183374(VS.85).aspx
        const sigArr = arr.subarray(0, 2);
        const type = Utils.ToText(sigArr);
        chunk = {
            name: 'Bitmap File Header',
            offset: 0,
            bytes: arr.subarray(0, 14),
            infos: null
        };
        const chunkList = [];
        let bytes = null;
        let infos = [];
        infos.push({ offset: 0, type });
        const size = this.binary.readUint32(arr, 2);
        infos.push({ offset:2, size });
        const offBits = this.binary.readUint32(arr, 10);
        infos.push({ offset:10, offBits });
        chunk.infos = infos;
        chunkList.push(chunk);
        // v4: https://msdn.microsoft.com/en-us/library/dd183380(v=vs.85).aspx
        // v5: https://msdn.microsoft.com/en-us/library/dd183381(v=vs.85).aspx

        chunk = {
            name: 'Bitmap Info Header (DIB Header)',
            offset: 14,
            bytes: null,
            infos: null
        };

        let bytes = null; 
        infos = [];
        let o = 14;
        const dibHeaderSize = this.binary.readUint32(arr, o);

        switch (dibHeaderSize) {
            case 12:
                chunk.name += ' BMPv2';
                break;
            case 40:
                chunk.name += ' BMPv3';
                break;
            case 108:
                chunk.name += ' BMPv4';
                break;
            case 124:
                chunk.name += ' BMPv5';
                break;
            default:
                chunk.name += ' unknown version';
                break;
        }

        // BMPv2
        infos.push({ offset:o, dibHeaderSize:dibHeaderSize });
        o += 4;
        infos.push({ offset:o, width:this.binary.readSint32(arr, o) });
        o += 4;
        infos.push({ offset:o, height:this.binary.readSint32(arr, o) });
        o += 4;

        // BMPv3
        if (dibHeaderSize > 12) {
            infos.push({ offset:o, planes:this.binary.readUint16(arr, o) });
            o += 2;
            infos.push({ offset:o, bitCount:this.binary.readUint16(arr, o) });
            o += 2;
            infos.push({ offset:o, compression:this.binary.readUint32(arr, o) });
            o += 4;
            infos.push({ offset:o, sizeImage:this.binary.readUint32(arr, o) });
            o += 4;
            infos.push({ offset:o, xPixelsPerMeter:this.binary.readUint32(arr, o) });
            o += 4;
            infos.push({ offset:o, yPixelsPerMeter:this.binary.readUint32(arr, o) });
            o += 4;
            infos.push({ offset:o, colorsUsed:this.binary.readUint32(arr, o) });
            o += 4;
            infos.push({ offset:o, colosImportant:this.binary.readUint32(arr, o) });
            o += 4;
        }

        // BMPv4
        if (dibHeaderSize > 40) {
            const redMask   = Utils.ToHex(this.binary.readUint32(arr, o),   8);
            const greenMask = Utils.ToHex(this.binary.readUint32(arr, o + 4), 8);
            const blueMask  = Utils.ToHex(this.binary.readUint32(arr, o + 8), 8);
            const alphaMask = Utils.ToHex(this.binary.readUint32(arr, o + 12), 8);
            infos.push({ offset: o,      redMask });
            infos.push({ offset: o + 4,  greenMask });
            infos.push({ offset: o + 8,  blueMask });
            infos.push({ offset: o + 12, alphaMask });
            o += 16;
            const colorSpaceType = this.binary.readUint32(arr, o);
            let colorSpaceTypeStr = `0x${Utils.ToHex(colorSpaceType, 8)}`;

            // https://msdn.microsoft.com/en-us/library/cc250396.aspx
            switch (colorSpaceType) {
                case 0x00000000:
                    colorSpaceTypeStr += '(CALIBRATED_RGB)';
                    break;
                case 0x73524742:
                    colorSpaceTypeStr += '(sRGB)';
                    break;
                case 0x57696E20:
                    colorSpaceTypeStr += '(Win )';
                    break;
                case 0x4d424544:
                    colorSpaceTypeStr += '(EMBEDED_PROFILE)';
                    break;
                default:
                    colorSpaceTypeStr += '(unknown)';
                    break;
            }

            infos.push({ offset: o, colorSpaceType: colorSpaceTypeStr });
            o += 4;
            // CIEXYZTRIPLE structure
            // https://msdn.microsoft.com/en-us/library/dd371833(v=vs.85).aspx
            infos.push({
                offset: o,
                cieXRed: this.binary.readFP2Dot30(arr, o),
                cieYRed: this.binary.readFP2Dot30(arr, o + 4),
                cieZRed: this.binary.readFP2Dot30(arr, o + 8)
            });
            o += 12;
            infos.push({
                offset: o,
                cieXGreen: this.binary.readFP2Dot30(arr, o),
                cieYGreen: this.binary.readFP2Dot30(arr, o + 4),
                cieZGreen: this.binary.readFP2Dot30(arr, o + 8)
            });
            o += 12;
            infos.push({
                offset: o,
                cieXBlue: this.binary.readFP2Dot30(arr, o),
                cieYBlue: this.binary.readFP2Dot30(arr, o + 4),
                cieZBlue: this.binary.readFP2Dot30(arr, o + 8)
            });
            o += 12;
            const redGamma   = this.binary.readUint32(arr, o);
            const greenGamma = this.binary.readUint32(arr, o + 4);
            const blueGamma  = this.binary.readUint32(arr, o + 8);
            infos.push({ offset: o,     redGamma: (redGamma / 0x10000) });
            infos.push({ offset: o + 4, greenGamma: (greenGamma / 0x10000) });
            infos.push({ offset: o + 8, blueGamma: (blueGamma / 0x10000) });
            o += 12;
            const intent = this.binary.readUint32(arr, o);
            const profileData = this.binary.readUint32(arr, o + 4);
            const profileSize = this.binary.readUint32(arr, o + 8);
            const reserved = this.binary.readUint32(arr, o + 12);
            infos.push({ offset: o,      intent });
            infos.push({ offset: o + 4,  profileData });
            infos.push({ offset: o + 8,  profileSize });
            infos.push({ offset: o + 12, reserved });
            o += 16;
        }

        chunk.bytes = arr.subarray(14, 14 + dibHeaderSize);
        chunk.infos = infos;
        chunkList.push(chunk);

        this.chunkList = chunkList;
    }

    getChunkList() {
        return this.chunkList;
    }

    getICC() {
        let profileData;
        let profileSize;

        for (const idx in this.chunkList) {
            const chunk = this.chunkList[idx];
            const infos = chunk.infos;

            for (const idxInfo in infos) {
                const info = infos[idxInfo];

                if (info.offset === 126) {
                    profileData = info.profileData;
                }

                if (info.offset === 130) {
                    profileSize = info.profileSize;
                }
            }
        }

        if (profileData && profileSize) {
            const iccProfileData = this.data.subarray(profileData + 14, profileData + 14 + profileSize);
            const iccProfileArr = new Uint8Array(profileSize);
            iccProfileArr.set(iccProfileData, 0);
            return iccProfileArr;
        }

        return null;
    }

    build() {
        // TODO:
    }
}
