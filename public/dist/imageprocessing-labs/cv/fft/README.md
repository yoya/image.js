# Fast Fourier Transform (FFT) Module

## description

1D-FFT/IFFT, 2D-FFT/IFFT, Frequency Filtering

see also [blog entry][entry]

### sample
[![2d_fft](https://raw.github.com/wiki/wellflat/imageprocessing-labs/images/fft_filter.jpg)](http://rest-term.com/labs/html5/fft.html)

(Tests: IE9, Firefox8.0, Chrome16.0, Safari5.0, Opera11.60)

## usage
### 1D-FFT/IFFT

```js
var x1 = [], y1 = [], x2 = [], y2 = [], x3 = [], y3 = [], N = 32;
for(var i=0; i<N; i++) {
  x1[i] = x2[i] = 6*Math.cos(6*Math.PI*i/N) + 4*Math.sin(18*Math.PI*i/N);
  y1[i] = y2[i] = 0.0;
}
// initialize
FFT.init(N);
// 1D-FFT
FFT.fft1d(x2, y2);
for(var j=0; j<N; j++) {
  x3[j] = x2[j];
  y3[j] = y2[j];
}
// 1D-IFFT
FFT.ifft1d(x3, y3);
var out = "";
for(var i=0; i<N; i++){
  out += i + ": (" + x1[i] + ", " +y1[i]+ ") (" +
    x2[i] + ", " + y2[i] + ") (" + x3[i] + ", " + y3[i] + ")\n";
}
console.log("N: (Source) (FFT) (IFFT)");
console.log(out);
```

### 2D-FFT/IFFT, Frequency Filtering (High-Pass/Low-Pass/Band-Pass)

```js
// for HTML5 Canvas
var spectrum = document.querySelector('#Spectrum').getContext('2d'),
    result = document.querySelector('#Result').getContext('2d'),
    image = new Image();
image.src = '/path/to/image';
image.addEventListener('load', function(e) {
  var w = image.width,
      h = image.height, // w == h
      re = [],
      im = [];

  // initialize, radix-2 required
  FFT.init(w);
  FrequencyFilter.init(w);
  SpectrumViewer.init(spectrum);
  spectrum.drawImage(image, 0, 0);
  var src = spectrum.getImageData(0, 0, w, h),
      data = src.data,
      radius = 30,
      i, val, p;
  for(var y=0; y<h; y++) {
    i = y*w;
    for(var x=0; x<w; x++) {
      re[i + x] = data[(i << 2) + (x << 2)];
      im[i + x] = 0.0;
    }
  }
  // 2D-FFT
  FFT.fft2d(re, im);
  // swap quadrant
  FrequencyFilter.swap(re, im);
  // High Pass Filter
  FrequencyFilter.HPF(re, im, radius);
  // Low Pass Filter
  FrequencyFilter.LPF(re, im, radius);
  // Band Path Filter
  FrequencyFilter.BPF(re, im, radius, radius/2);
  // render spectrum
  SpectrumViewer.render(re, im);
  // swap quadrant
  FrequencyFilter.swap(re, im);
  // 2D-IFFT
  FFT.ifft2d(re, im);
  for(var y=0; y<h; y++) {
    i = y*w;
    for(var x=0; x<w; x++) {
      val = re[i + x];
      p = (i << 2) + (x << 2);
      data[p] = data[p + 1] = data[p + 2] = val;
    }
  }
  // put result image on the canvas
  result.putImageData(src, 0, 0);
}, false);
```

license
----------
Copyright &copy; 2014 wellflat Licensed under the [MIT License][MIT]

[MIT]: http://www.opensource.org/licenses/mit-license.php
[entry]: http://rest-term.com/archives/2966/
