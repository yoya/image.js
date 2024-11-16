// 使わなくなった関数

function multipliedImageData(imageData) {
    const { width, height, data } = imageData;
    const mImageData = new ImageData(width, height);
    const d = mImageData.data;
    const size = 4 * width * height;
    for (let i = 0 ; i < size;  i += 4) {
        const [r, g, b, a] = data.subarray(i, i + 4);
        d[i]   = r * a/255;
        d[i+1] = g * a/255;
        d[i+2] = b * a/255;
        d[i+3] = a;
    }
    return mImageData;
}
