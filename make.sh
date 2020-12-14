#!/bin/bash
base_dir=$(cd "$(dirname "$0")";pwd)
mode="release"
if [ $1 ]; then mode=$1; fi
echo $base_dir
cd node_modules/physx/physx/compiler/emscripten-$mode/
make
mkdir -p $base_dir/builds
cp $base_dir/node_modules/physx/physx/bin/emscripten/$mode/physx.$mode.asm.js $base_dir/builds/physx.$mode.asm.js
cp $base_dir/node_modules/physx/physx/bin/emscripten/$mode/physx.$mode.wasm.js $base_dir/builds/physx.$mode.wasm.js
cp $base_dir/node_modules/physx/physx/bin/emscripten/$mode/physx.$mode.wasm.wasm $base_dir/builds/physx.$mode.wasm.wasm