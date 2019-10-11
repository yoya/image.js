# lcms.js

JavaScript Little-CMS powered by emscripten

# usage

<script type="text/javascript" src="lcms-wrapper.js"> </script>
<script type="text/javascript" src="bin/lcms.js"> </script>

<script>
var profile = cmsCreate_sRGBProfile();
var text = cmsGetProfileInfoASCII(profile,
                                  cmsInfoDescription, "en", "US");
var rXYZ = cmsReadTag_XYZ(profile, cmsSigRedColorantTag);
var rxyY = cmsXYZ2xyY(rXYZ);

console.log(text);
console.log(rXYZ, rxyY);
</script>

# demo

- test.html (print to developer console)
- http://app.awm.jp/image.js/lcms.html
  - https://github.com/yoya/image.js / lcms.html,lcms.js