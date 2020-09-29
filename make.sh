#!/bin/bash
base_dir=$(cd "$(dirname "$0")";pwd)
echo $base_dir
cd node_modules/physx/physx/compiler/emscripten-release/
make
mkdir -p $base_dir/builds
cp $base_dir/node_modules/physx/physx/bin/emscripten/release/physx.release.asm.js $base_dir/builds/physx.release.asm.js
cp $base_dir/node_modules/physx/physx/bin/emscripten/release/physx.release.wasm.js $base_dir/builds/physx.release.wasm.js
cp $base_dir/node_modules/physx/physx/bin/emscripten/release/physx.release.wasm.wasm $base_dir/builds/physx.release.wasm.wasm