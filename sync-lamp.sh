#!/bin/bash

# Sync Pwr360 - Prepara carpeta para subir por SFTP
# Uso: ./sync-lamp.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/lamp-build"
VERSION_FILE="$SCRIPT_DIR/VERSION"

# Incrementar versión automáticamente
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
    # Extraer partes de la versión (major.minor.patch)
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    # Incrementar patch
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
    echo "$NEW_VERSION" > "$VERSION_FILE"
else
    NEW_VERSION="0.0.1"
    echo "$NEW_VERSION" > "$VERSION_FILE"
fi

echo "=========================================="
echo "Sincronizando Pwr360 v$NEW_VERSION para LAMP"
echo "=========================================="

# Verificar que existe lamp-build (debe haberse creado con build-for-lamp.sh primero)
if [ ! -d "$BUILD_DIR/vendor" ]; then
    echo "ERROR: No existe lamp-build/vendor"
    echo "Ejecuta primero: ./build-for-lamp.sh"
    exit 1
fi

# 1. Sincronizar backend (sin vendor) - PRIMERO para que --delete no borre el frontend
echo ""
echo ">>> Sincronizando backend..."
rsync -av --delete \
    --exclude='vendor' \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/data/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='bootstrap/cache/*.php' \
    --exclude='.git' \
    --exclude='tests' \
    --exclude='.DS_Store' \
    --exclude='public/assets' \
    --exclude='public/app.html' \
    "$SCRIPT_DIR/backend/" "$BUILD_DIR/"

# 2. Actualizar versión en frontend
echo ""
echo ">>> Actualizando versión en frontend..."
echo "export const APP_VERSION = '$NEW_VERSION';" > "$SCRIPT_DIR/frontend/src/version.ts"

# 3. Build del frontend
echo ""
echo ">>> Compilando frontend..."
cd "$SCRIPT_DIR/frontend"
npm run build

# 3. Copiar frontend al build (DESPUES del rsync)
echo ""
echo ">>> Copiando frontend..."
rm -rf "$BUILD_DIR/public/assets"
cp -r "$SCRIPT_DIR/frontend/dist/assets" "$BUILD_DIR/public/assets"
cp "$SCRIPT_DIR/frontend/dist/index.html" "$BUILD_DIR/public/app.html"

echo ""
echo ">>> Generando ZIP..."
cd "$SCRIPT_DIR"
rm -f pwr360-sync.zip
cd "$BUILD_DIR"
zip -rq "$SCRIPT_DIR/pwr360-sync.zip" . -x "*.git*" -x "vendor/*"

echo ""
echo "=========================================="
echo "Listo!"
echo ""
echo "Archivo generado: $SCRIPT_DIR/pwr360-sync.zip"
echo ""
echo "En el servidor LAMP:"
echo "  cd /app/data && unzip -o ~/pwr360-sync.zip"
echo "  php artisan config:clear && php artisan route:clear"
echo "=========================================="
