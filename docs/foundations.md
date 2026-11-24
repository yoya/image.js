# 基礎資料

image.js のアルゴリズムを理解・実装するための、土台になる資料をまとめます。
分野ごとに、関係するページと資料を並べています。
FFT の原論文は [references.md](references.md) にあります。

- 【無料】は公式に無料で読めるもの、【有料】は購入や購読が必要なものです。
- 印がない書籍は市販の本です。
- PDF などの本体は著作権のため置かず、リンクだけを載せています。

## 全体（画像処理の教科書）

- R. C. Gonzalez and R. E. Woods, "Digital Image Processing", 4th ed., Pearson, 2018.
  - 階調変換、空間フィルタ、周波数領域、モルフォロジー、色、圧縮まで、画像処理全般の定番の教科書です。
- CG-ARTS『ディジタル画像処理［改訂第二版］』
  - 日本語で画像処理全般を学べる教科書です。
- R. Szeliski, "Computer Vision: Algorithms and Applications", 2nd ed., Springer, 2022.
  - 幾何変換・補間・特徴量など、コンピュータビジョン寄りの内容です。
  - https://szeliski.org/Book/ 【無料】（著者のサイトで PDF を公開）

## 数学（線形代数・信号処理）

関係するページ：colormat、affintrans、homography、matmulti、spectrum、convolution など

- G. Strang, MIT 18.06 Linear Algebra（講義動画・資料）
  - 行列による色変換や座標変換の土台になります。
  - https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/ 【無料】
- S. W. Smith, "The Scientist and Engineer's Guide to Digital Signal Processing"
  - 畳み込み、フーリエ変換、フィルタ設計を、数式を控えめに解説しています。
  - https://www.dspguide.com/ 【無料】

## 幾何変換・補間

関係するページ：transform、affintrans、helmerttrans、homography、rescale、fisheye、gravitylens、mirror

- R. Hartley and A. Zisserman, "Multiple View Geometry in Computer Vision", 2nd ed., Cambridge University Press, 2004.
  - 射影変換（ホモグラフィー）とその推定方法の標準的な教科書です。
  - https://doi.org/10.1017/CBO9780511811685
- D. P. Mitchell and A. N. Netravali, "Reconstruction Filters in Computer Graphics", SIGGRAPH '88, 1988.
  - lib/interpolate.js の cubicBC（B, C パラメータの 3 次補間）の出典です。
  - https://doi.org/10.1145/54852.378514
- 今給黎隆「単位正方形の射影変換の変換係数」（スライド）
  - コード内で参照しています。
  - https://speakerdeck.com/imagire/dan-wei-zheng-fang-xing-falseshe-ying-bian-huan-falsebian-huan-xi-shu 【無料】

## フィルタ・特徴量

関係するページ：convolution、smoothing、shapenblur、median、rankorder、morphology、kuwahara、lbp

- 畳み込み・平滑化・メディアン・モルフォロジーは、全体の教科書（Gonzalez & Woods など）で学べます。
- M. Kuwahara, K. Hachimura, S. Eiho and M. Kinoshita, "Processing of RI-Angiocardiographic Images", Digital Processing of Biomedical Images, Springer, 1976.
  - Kuwahara フィルタの原典です。
  - https://doi.org/10.1007/978-1-4684-0769-3_13 【有料】
- T. Ojala, M. Pietikäinen and T. Mäenpää, "Multiresolution Gray-Scale and Rotation Invariant Texture Classification with Local Binary Patterns", IEEE TPAMI, 24(7), 2002.
  - LBP（Local Binary Pattern）の代表的な論文です。
  - https://doi.org/10.1109/TPAMI.2002.1017623 【有料】

## 階調・ハーフトーン・減色

関係するページ：ordered-dither、halftone、binarize、bitdepth、equalize、gamma、tonecurve、colorreduction、k-means

- R. Ulichney, "Digital Halftoning", MIT Press, 1987.
  - 組織的ディザ、誤差拡散などハーフトーン全般の古典です。
- L. Crocker 他 "DHALF.TXT", 1991（ディザ手法のまとめ、Web アーカイブ）
  - コード内で参照しています。Floyd–Steinberg などの誤差拡散の係数がまとまっています。
  - http://web.archive.org/web/20190601182248/http://www.efg2.com/Lab/Library/ImageProcessing/DHALF.TXT 【無料】
- P. Heckbert, "Color Image Quantization for Frame Buffer Display", SIGGRAPH '82, 1982.
  - colorreduction の頻度法（popularity）と中央値分割（median cut）の原典です。
  - https://doi.org/10.1145/800064.801294

## 色（色空間・測色・カラーマネジメント）

関係するページ：cie、cie_ind、grayscale、saturation、colormat、colortrans、sepia、icc、lcms、colorchecker、boostrgyb、pseudocolor

- G. Wyszecki and W. S. Stiles, "Color Science: Concepts and Methods, Quantitative Data and Formulae", 2nd ed., Wiley, 1982.
  - 測色（CIE XYZ、色度図、等色関数）の定番の専門書です。
- Bruce Lindbloom（色空間の変換式の解説とデータ）
  - RGB ⇔ XYZ ⇔ Lab などの式と係数がまとまっています。
  - http://www.brucelindbloom.com/ 【無料】
- CIE 公式データ表
  - 等色関数、標準イルミナントなどの数値データです。
  - https://cie.co.at/data-tables 【無料】
- Colour & Vision Research Laboratory（CVRL）
  - 等色関数や錐体分光感度のデータベースです。
  - http://www.cvrl.org/ 【無料】
- M. Stokes et al., "A Standard Default Color Space for the Internet - sRGB", W3C, 1996.
  - sRGB の定義（正式規格は IEC 61966-2-1【有料】）。
  - https://www.w3.org/Graphics/Color/sRGB.html 【無料】
- ICC プロファイル仕様（ICC.1:2022）
  - icc、lcms で読む ICC プロファイルの形式です。
  - https://www.color.org/icc_specs2.xalter 【無料】
- G. M. Machado, M. M. Oliveira and L. A. F. Fernandes, "A Physiologically-based Model for Simulation of Color Vision Deficiency", IEEE TVCG, 15(6), 2009.
  - 色覚シミュレーションの行列の出典です。コード内で参照しています。
  - https://doi.org/10.1109/TVCG.2009.113
  - https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html 【無料】（著者のページ、行列の一覧あり）
- W3C Filter Effects（CSS の sepia や contrast などの定義式）
  - https://www.w3.org/TR/filter-effects/ 【無料】

## 画質評価

関係するページ：ssim、diff

- Z. Wang, A. C. Bovik, H. R. Sheikh and E. P. Simoncelli, "Image Quality Assessment: From Error Visibility to Structural Similarity", IEEE TIP, 13(4), 2004.
  - SSIM の原論文です。
  - https://doi.org/10.1109/TIP.2003.819861

## ファイル形式

関係するページ：format、jpegmeta、pngfilter、icc、extract、lzw、mag（lib/png.js、jpeg.js、gif.js、tiff.js、bmp.js）

- PNG：W3C "Portable Network Graphics (PNG) Specification"
  - https://www.w3.org/TR/PNG/ 【無料】
- JPEG：ITU-T T.81（ISO/IEC 10918-1）
  - https://www.w3.org/Graphics/JPEG/itu-t81.pdf 【無料】
- JFIF 1.02
  - https://www.w3.org/Graphics/JPEG/jfif3.pdf 【無料】
- Exif などのタグ一覧（ExifTool）
  - https://exiftool.org/TagNames/EXIF.html 【無料】
- GIF89a
  - https://www.w3.org/Graphics/GIF/spec-gif89a.txt 【無料】
- TIFF 6.0
  - https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf 【無料】
- BMP：Microsoft "Bitmap Storage"
  - https://learn.microsoft.com/en-us/windows/win32/gdi/bitmap-storage 【無料】

## Web プラットフォーム

image.js の全ページが使っている API です。

- Canvas API（MDN）
  - https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API 【無料】
- HTML Living Standard の canvas の章（ImageData、色空間、プレマルチプライドアルファなどの正確な定義）
  - https://html.spec.whatwg.org/multipage/canvas.html 【無料】
- Compression Streams API（MDN）
  - PNG の zlib 展開に使っています。
  - https://developer.mozilla.org/en-US/docs/Web/API/Compression_Streams_API 【無料】

## その他

- F. Rosenblatt, "The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain", Psychological Review, 65(6), 1958.
  - perceptron の原論文です。
  - https://doi.org/10.1037/h0042519
- M. F. Barnsley, "Fractals Everywhere", Academic Press, 1988.
  - fern（バーンズリーのシダ）の反復関数系の原典です。
