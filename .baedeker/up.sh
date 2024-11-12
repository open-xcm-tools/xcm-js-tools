#!/bin/sh
set -eux

if [ ! -e baedeker ]; then
    curl -L https://github.com/UniqueNetwork/baedeker/releases/download/v0.1.5/baedeker -o baedeker
    chmod +x baedeker
fi

if [ ! -d vendor/baedeker-library ]; then
    mkdir -p vendor
    git clone https://github.com/UniqueNetwork/baedeker-library vendor/baedeker-library
fi

BDK_DIR=$(dirname $(readlink -f "$0"))

RUST_LOG=info ./baedeker \
    --spec=docker \
    -J./vendor/ \
    --generator=docker_compose=./.bdk-env \
    --generator=docker_compose_discover=./.bdk-env/discover.env \
    --secret=file=./.bdk-env/secret \
    --tla-str=relay_spec=rococo-local \
    --input-modules='lib:baedeker-library/ops/nginx-dev.libsonnet' \
    --input-modules='lib:baedeker-library/ops/devtools.libsonnet' \
    --tla-str=repoDir=$(realpath .) \
    $@ \
    $BDK_DIR/rewrites.jsonnet

cd $BDK_DIR/.bdk-env

docker compose up -d --wait --remove-orphans
