#!/bin/bash

# Build Pwr360 para Cloudron LAMP
# Genera una carpeta lista para subir al LAMP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/lamp-build"
VERSION_FILE="$SCRIPT_DIR/VERSION"

# Leer versión actual (sin incrementar, eso lo hace sync-lamp.sh)
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
else
    CURRENT_VERSION="0.0.1"
    echo "$CURRENT_VERSION" > "$VERSION_FILE"
fi

echo "=========================================="
echo "Building Pwr360 v$CURRENT_VERSION para Cloudron LAMP"
echo "=========================================="

# Limpiar build anterior
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 1. Actualizar versión en frontend
echo ""
echo ">>> Actualizando versión en frontend..."
echo "export const APP_VERSION = '$CURRENT_VERSION';" > "$SCRIPT_DIR/frontend/src/version.ts"

# 2. Build del frontend
echo ""
echo ">>> Compilando frontend..."
cd "$SCRIPT_DIR/frontend"
npm run build

# 3. Copiar backend
echo ""
echo ">>> Copiando backend..."
cd "$SCRIPT_DIR"

# Copiar todo el backend excepto archivos innecesarios
rsync -av --progress backend/ "$BUILD_DIR/" \
    --exclude='vendor' \
    --exclude='node_modules' \
    --exclude='.env' \
    --exclude='.env.local' \
    --exclude='storage/logs/*' \
    --exclude='storage/framework/cache/data/*' \
    --exclude='storage/framework/sessions/*' \
    --exclude='storage/framework/views/*' \
    --exclude='storage/app/*' \
    --exclude='bootstrap/cache/*.php' \
    --exclude='.git' \
    --exclude='tests' \
    --exclude='phpunit.xml'

# 4. Instalar dependencias de PHP (producción)
echo ""
echo ">>> Instalando dependencias de Composer..."
cd "$BUILD_DIR"
composer install --no-dev --optimize-autoloader --no-interaction

# 5. Copiar frontend build al public
echo ""
echo ">>> Copiando frontend al public..."
cp -r "$SCRIPT_DIR/frontend/dist/"* "$BUILD_DIR/public/"

# Renombrar index.html a app.html (Laravel tiene su propio index.php)
if [ -f "$BUILD_DIR/public/index.html" ]; then
    mv "$BUILD_DIR/public/index.html" "$BUILD_DIR/public/app.html"
fi

# 6. Crear estructura de storage vacía
echo ""
echo ">>> Creando estructura de directorios..."
mkdir -p "$BUILD_DIR/storage/app/public"
mkdir -p "$BUILD_DIR/storage/framework/cache/data"
mkdir -p "$BUILD_DIR/storage/framework/sessions"
mkdir -p "$BUILD_DIR/storage/framework/views"
mkdir -p "$BUILD_DIR/storage/logs"
mkdir -p "$BUILD_DIR/bootstrap/cache"

# Crear .gitkeep en directorios vacíos
touch "$BUILD_DIR/storage/app/.gitkeep"
touch "$BUILD_DIR/storage/app/public/.gitkeep"
touch "$BUILD_DIR/storage/framework/cache/data/.gitkeep"
touch "$BUILD_DIR/storage/framework/sessions/.gitkeep"
touch "$BUILD_DIR/storage/framework/views/.gitkeep"
touch "$BUILD_DIR/storage/logs/.gitkeep"
touch "$BUILD_DIR/bootstrap/cache/.gitkeep"

# 7. Permisos
echo ""
echo ">>> Configurando permisos..."
chmod -R 775 "$BUILD_DIR/storage"
chmod -R 775 "$BUILD_DIR/bootstrap/cache"

# 8. Crear ZIP para subir fácilmente
echo ""
echo ">>> Creando archivo ZIP..."
cd "$SCRIPT_DIR"
rm -f pwr360-lamp.zip
cd "$BUILD_DIR"
zip -r "$SCRIPT_DIR/pwr360-lamp.zip" . -x "*.git*"

echo ""
echo "=========================================="
echo "Build completado!"
echo ""
echo "Archivos generados:"
echo "  - Carpeta: $BUILD_DIR"
echo "  - ZIP: $SCRIPT_DIR/pwr360-lamp.zip"
echo ""
echo "Para desplegar en Cloudron LAMP:"
echo "  1. Subir el contenido de lamp-build/ a /app/code/ en LAMP"
echo "     O descomprimir pwr360-lamp.zip en /app/code/"
echo "  2. El DocumentRoot debe apuntar a /app/code/public"
echo "  3. La primera vez que accedas, se creará .env y se correrán migraciones"
echo "=========================================="
