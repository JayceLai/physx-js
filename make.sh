#!/bin/bash
base_dir=$(cd "$(dirname "$0")";pwd)
echo $base_dir
cd node_modules/physx/physx/compiler/emscripten-release/
make
mkdir -p $base_dir/src/dist
cp $base_dir/node_modules/physx/physx/bin/emscripten/release/physx.release.js $base_dir/src/dist/physx.release.js
cp $base_dir/node_modules/physx/physx/bin/emscripten/release/physx.release.wasm $base_dir/src/dist/physx.release.wasm