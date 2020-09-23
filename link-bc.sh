#!/bin/bash
base_dir=$(cd "$(dirname "$0")";pwd)
echo $base_dir

cd /mnt/d/Github/Physics/emscripten-core/emsdk/
./emsdk activate latest
source ./emsdk_env.sh --build=Release
# emcc -v

cd $base_dir/node_modules/physx/physx/bin/emscripten/release/
emcc PhysX_static.bc PhysXCharacterKinematic_static.bc PhysXCommon_static.bc PhysXCooking_static.bc PhysXExtensions_static.bc PhysXFoundation.bc PhysXPvdSDK_static.bc PhysXVehicle_static.bc -o final.asm.js -s WASM=0
