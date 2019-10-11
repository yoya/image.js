'use strict';
/*
 * 2017/05/30- (c) yoya@awm.jp
 */

document.addEventListener('DOMContentLoaded', function(event) {
    main();
});

function main() {
    // console.debug("main");
    const srcCanvas = document.getElementById('srcCanvas');
    const dstCanvas = document.getElementById('dstCanvas');
    let srcImage = new Image(srcCanvas.width, srcCanvas.height);
    dropFunction(document, function(dataURL) {
	srcImage = new Image();
	srcImage.onload = function() {
	    drawSrcImageAndFisheye(srcImage, srcCanvas, dstCanvas);
	};
	srcImage.src = dataURL;
    }, 'DataURL');
    bindFunction({
 'maxWidthHeightRange':'maxWidthHeightText',
		  'guideCheckbox':null,
		  'srcProjSelect':null,
		  'srcProjXRange':'srcProjXText',
		  'srcProjYRange':'srcProjYText',
		  'srcProjRRange':'srcProjRText',
		  'dstProjSelect':null,
		  'dstProjXRange':'dstProjXText',
		  'dstProjYRange':'dstProjYText',
		  'dstProjRRange':'dstProjRText'
		 },
		 function(target) {
		     console.debug('target id:' + target.id);
		     drawSrcImageAndFisheye(srcImage, srcCanvas, dstCanvas);
		 });
}

function drawSrcImageAndFisheye(srcImage, srcCanvas, dstCancas) {
    const maxWidthHeight = parseFloat(document.getElementById('maxWidthHeightRange').value);
    const guide = document.getElementById('guideCheckbox').checked;
    const srcProj = document.getElementById('srcProjSelect').value;
    const srcProjX = parseFloat(document.getElementById('srcProjXRange').value);
    const srcProjY = parseFloat(document.getElementById('srcProjYRange').value);
    const srcProjR = parseFloat(document.getElementById('srcProjRRange').value);
    const dstProj = document.getElementById('dstProjSelect').value;
    const dstProjX = parseFloat(document.getElementById('dstProjXRange').value);
    const dstProjY = parseFloat(document.getElementById('dstProjYRange').value);
    const dstProjR = parseFloat(document.getElementById('dstProjRRange').value);
    // console.debug("drawSrcImageAndFisheye  guide:" + guide);
    // console.debug("srcProj:" + srcProj+","+srcProjX+","+srcProjY+","+ srcProjR);
    // console.debug("dstProj:" + dstProj+","+dstProjX+","+dstProjY+","+ dstProjR);
    drawSrcImage(srcImage, srcCanvas, maxWidthHeight);
    drawFisheye(srcCanvas, dstCanvas, guide,
		srcProj, srcProjX, srcProjY, srcProjR,
		dstProj, dstProjX, dstProjY, dstProjR);
}

function fisheyeTransform(dstX, dstY, dstImageData, srcImageData,
			  srcProj, srcProjX, srcProjY, srcProjR,
			  dstProj) {
    const [dstWidth, dstHeight] = [dstImageData.width, dstImageData.height];
    const [srcWidth, srcHeight] = [srcImageData.width, srcImageData.height];
    let xyz;
    switch (dstProj) {
    case 'equirectangular':
	xyz = equirectangular2xyz(dstX, dstY, dstWidth, dstHeight);
	break;
    case 'fisheye':
	xyz = fisheye2xyz(dstX, dstY, dstWidth, dstHeight);
	break;
    default:
	console.error('dstProj:' + dstProj);
	return null;
    }
    if (xyz === null) {
	return [-1, -1]; // out of area.
    }
    let srcXY;
    switch (srcProj) {
    case 'equirectangular':
	srcXY = xyz2equirectangular(xyz, srcWidth, srcHeight);
	break;
    case 'fisheye':
	srcXY = xyz2fisheye(xyz, srcWidth, srcHeight, srcProjX, srcProjY, srcProjR);
	break;
    default:
	console.error('dstProj:' + dstProj);
	return null;
    }
    return srcXY; // [x, y]
}

function drawFisheye(srcCanvas, dstCanvas, guide,
		     srcProj, srcProjX, srcProjY, srcProjR,
		     dstProj, dstProjX, dstProjY, dstProjR) {
    // console.debug("drawFisheye");
    const srcCtx = srcCanvas.getContext('2d');
    const dstCtx = dstCanvas.getContext('2d');
    const srcWidth = srcCanvas.width; const srcHeight = srcCanvas.height;
    let dstWidth  = srcWidth;
    let dstHeight = srcHeight;
    //
    if (dstWidth !== dstHeight)  {
	if (dstWidth < dstHeight)  {
	    dstWidth = dstHeight;
	} else {
	    dstHeight = dstWidth;
	}
    }
    dstCanvas.width  = dstWidth;
    dstCanvas.height = dstHeight;
    //
    const outfill = 'black';
    const srcImageData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
    const dstImageData = dstCtx.createImageData(dstWidth, dstHeight);
    for (let dstY = 0; dstY < dstHeight; dstY++) {
        for (let dstX = 0; dstX < dstWidth; dstX++) {
	    let [srcX, srcY] = fisheyeTransform(dstX, dstY, dstImageData,
						srcImageData,
						srcProj, srcProjX, srcProjY, srcProjR,
						dstProj);
	    srcX = Math.round(srcX);
	    srcY = Math.round(srcY);
	    const rgba = getRGBA(srcImageData, srcX, srcY, outfill);
	    setRGBA(dstImageData, dstX, dstY, rgba);
	}
    }
    dstCtx.putImageData(dstImageData, 0, 0);
    if (guide) {
	const srcProjCenterX = srcProjX * srcWidth;
	const srcProjCenterY = srcProjY * srcHeight;
	const srcProjRadius = srcProjR * (srcWidth + srcHeight) / 4;
	srcCtx.save();
	srcCtx.strokeStyle = 'yellow';
	srcCtx.lineWidth = 1.5;
	srcCtx.beginPath();
	srcCtx.arc(srcProjCenterX, srcProjCenterY,
		   srcProjRadius, 0, 2 * Math.PI);
	srcCtx.stroke();
	srcCtx.restore();
    }
}
