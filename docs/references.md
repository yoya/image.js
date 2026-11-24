# 参考文献

画像処理全般の基礎資料は [foundations.md](foundations.md) にあります。

## FFT（lib/fft.js）

- J. W. Cooley and J. W. Tukey, "An Algorithm for the Machine Calculation of Complex Fourier Series",
  Mathematics of Computation, 19(90), pp. 297-301, 1965.
  - radix-2 FFT
  - https://doi.org/10.1090/S0025-5718-1965-0178586-1 （AMS のサイトで無料で読めます）
- L. I. Bluestein, "A Linear Filtering Approach to the Computation of Discrete Fourier Transform",
  IEEE Transactions on Audio and Electroacoustics, 18(4), pp. 451-455, 1970.
  - 任意サイズの FFT（Bluestein 法、chirp-z）
  - https://doi.org/10.1109/TAU.1970.1162132 （IEEE Xplore、有料）
- W. H. Press, S. A. Teukolsky, W. T. Vetterling and B. P. Flannery, "Numerical Recipes", "FFT of Real Functions".
  - 実数データ 2 本を 1 回の複素 FFT で変換する方法
  - https://numerical.recipes/
