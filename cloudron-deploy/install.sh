#!/bin/bash
# Script de instalación para Cloudron LAMP
# Estructura: /app/public es el Document Root
# El resto de Laravel va en /app/ (un nivel arriba de public)

set -e

# Detectar directorio de datos (Cloudron usa /app/data)
if [ -d "/app/data" ]; then
    APP_DIR="/app/data"
else
    APP_DIR="/app"
fi

cd "$APP_DIR"

echo "=== Instalando Pwr360 ==="
echo "   Directorio: $APP_DIR"

# 1. Configurar entorno
echo "1. Configurando entorno..."
# Buscar .env.cloudron en varios lugares
if [ -f ".env.cloudron" ]; then
    cp .env.cloudron .env
elif [ -f "cloudron-deploy/.env.cloudron" ]; then
    cp cloudron-deploy/.env.cloudron .env
else
    echo "ERROR: No se encontró .env.cloudron"
    exit 1
fi

# 2. Instalar dependencias de Composer (ANTES de cualquier comando artisan)
echo "2. Instalando dependencias PHP..."
composer install --optimize-autoloader --no-dev --no-interaction

# 3. Generar APP_KEY si no existe
if ! grep -q "APP_KEY=base64:" .env; then
    echo "   Generando APP_KEY..."
    php artisan key:generate --force
fi

# 4. Ejecutar migraciones
echo "3. Ejecutando migraciones..."
php artisan migrate --force

# 5. Ejecutar seeders
echo "4. Cargando ejercicios predefinidos..."
php artisan db:seed --force

# 6. Crear link simbólico de storage
echo "5. Configurando storage..."
rm -f public/storage
php artisan storage:link

# 7. Optimizar para producción
echo "6. Optimizando..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 8. Permisos
echo "7. Configurando permisos..."
chmod -R 775 storage bootstrap/cache

echo ""
echo "=== Instalación completada ==="
echo ""
echo "Accedé a tu dominio para completar el wizard de configuración inicial."
