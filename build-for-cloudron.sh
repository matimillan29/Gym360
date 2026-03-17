#!/bin/bash

# Build and push Pwr360 to private Docker registry for Cloudron
# Usage: ./build-for-cloudron.sh [tag]

set -e

REGISTRY="hub.millan.ar"
IMAGE_NAME="pwr360"
TAG="${1:-latest}"

echo "=========================================="
echo "Building Pwr360 for Cloudron (linux/amd64)"
echo "Registry: $REGISTRY"
echo "Image: $IMAGE_NAME:$TAG"
echo "=========================================="

# Ensure buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo "ERROR: docker buildx no está disponible"
    echo "Instalalo con: brew install docker-buildx"
    exit 1
fi

# Create/use builder for multi-platform
BUILDER_NAME="pwr360-builder"
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo ">>> Creando builder para multi-plataforma..."
    docker buildx create --name $BUILDER_NAME --use --bootstrap
fi
docker buildx use $BUILDER_NAME

# Build for AMD64 (Cloudron) using buildx with --load, then push
# This is more reliable than --push for private registries
echo ""
echo ">>> Building para linux/amd64 (Cloudron)..."
docker buildx build --platform linux/amd64 -t "$REGISTRY/$IMAGE_NAME:$TAG" --load .

echo ""
echo ">>> Pusheando imagen AMD64..."
docker push "$REGISTRY/$IMAGE_NAME:$TAG"

if [ "$TAG" != "latest" ]; then
    docker tag "$REGISTRY/$IMAGE_NAME:$TAG" "$REGISTRY/$IMAGE_NAME:latest"
    docker push "$REGISTRY/$IMAGE_NAME:latest"
fi

echo ""
echo ">>> Imagen AMD64 pusheada a $REGISTRY/$IMAGE_NAME:$TAG"

# Verificar arquitectura
echo ""
echo ">>> Verificando arquitectura:"
docker image inspect "$REGISTRY/$IMAGE_NAME:$TAG" --format 'Arquitectura: {{.Architecture}}'

# Build for local ARM (Mac Apple Silicon) for testing
echo ""
echo ">>> Building para ARM local (Mac)..."
docker build -t "pwr360:latest" -t "pwr360:local" .

echo ""
echo "=========================================="
echo "Build completado!"
echo ""
echo "Para actualizar Cloudron:"
echo "  cloudron update --app pwr.millan.ar --image $REGISTRY/$IMAGE_NAME:latest"
echo ""
echo "Para testing local (ARM):"
echo "  docker run --rm -p 8080:80 -v pwr360_data:/data pwr360:local"
echo "=========================================="
