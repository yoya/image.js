symbols=$(cat << EOS
cmsOpenProfileFromMem
cmsCreate_sRGBProfile
cmsGetProfileInfoASCII
cmsGetColorSpace
cmsFormatterForColorspaceOfProfile
cmsCreateTransform
cmsReadTag
cmsXYZ2xyY
EOS
)

exported_opt=""
for s in $symbols
  do exported_opt="\"_$s\",$exported_opt"
done

emcc -I ../include *.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -o lcms.js
emcc -I ../include *.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -O3 -o lcms-O3.js
