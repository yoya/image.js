EMCC=emcc
SRC_DIR=mm2/Little-CMS/src
INCLUDE_DIR=mm2/Little-CMS/include
BIN_DIR=bin
SYMBOLS=$(cat export.txt)

exported_opt=""
for s in $SYMBOLS
do exported_opt="\"_$s\",$exported_opt"
done

$EMCC -o $BIN_DIR/lcms.js -I $INCLUDE_DIR $SRC_DIR/*.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -s ASSERTIONS=1 -s TOTAL_MEMORY=33554432

$EMCC -o $BIN_DIR/lcms-O1.js -I $INCLUDE_DIR $SRC_DIR/*.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -s ASSERTIONS=1 -s TOTAL_MEMORY=33554432

# $EMCC -o $BIN_DIR/lcms-O2.js -I $INCLUDE_DIR $SRC_DIR/*.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -O2 -s ASSERTIONS=1
# $EMCC -o $BIN_DIR/lcms-O3.js -I $INCLUDE_DIR $SRC_DIR/*.c -s EXPORTED_FUNCTIONS=["$exported_opt"] -O3 -s ASSERTIONS=1

$EMCC -o $BIN_DIR/lcms-all.js -I $INCLUDE_DIR $SRC_DIR/*.c -s EXPORT_ALL=1 -s ASSERTIONS=1 -s TOTAL_MEMORY=33554432
