#!/bin/bash

export EMSCRIPTEN=/mnt/d/Github/Physics/emscripten-core/emsdk/upstream/emscripten
export PM_cmake_PATH=/usr

cd node_modules/physx/physx
./generate_projects.sh emscripten