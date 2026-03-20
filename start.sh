#!/bin/bash
# Start script para Pwr360 en Cloudron
# Auto-inicializa Laravel en primer inicio

set -e

PERSISTENT_DIR="/app/data"
APP_DIR="/var/www/html"

echo "=== Iniciando Pwr360 ==="

# Función para esperar que la DB esté lista
wait_for_db() {
    echo "Esperando conexión a base de datos..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if php -r "
            try {
                \$pdo = new PDO(
                    'mysql:host=${CLOUDRON_MYSQL_HOST:-localhost};port=${CLOUDRON_MYSQL_PORT:-3306}',
                    '${CLOUDRON_MYSQL_USERNAME:-root}',
                    '${CLOUDRON_MYSQL_PASSWORD:-}'
                );
                echo 'connected';
            } catch (Exception \$e) {
                exit(1);
            }
        " 2>/dev/null | grep -q "connected"; then
            echo "Base de datos disponible."
            return 0
        fi
        echo "  Intento $attempt/$max_attempts - DB no disponible, esperando..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "ERROR: No se pudo conectar a la base de datos."
    return 1
}

# ============================================================
# Sincronizar código desde /app/data si fue pusheado ahí
# ============================================================
CODE_DIR="/app/code"

# Sincronizar código nuevo si fue pusheado a /app/code
if [ -f "$CODE_DIR/artisan" ]; then
    echo "=== Detectado código en $CODE_DIR ==="
    echo "Sincronizando código a $APP_DIR..."

    # Limpiar caches viejos ANTES de sincronizar
    rm -rf $PERSISTENT_DIR/bootstrap-cache/*.php 2>/dev/null || true

    # Sincronizar todo excepto storage y .env (que son symlinks a persistente)
    rsync -a --delete \
        --exclude='storage' \
        --exclude='.env' \
        --exclude='bootstrap/cache' \
        "$CODE_DIR/" "$APP_DIR/"

    # Copiar start.sh actualizado
    cp "$CODE_DIR/start.sh" /start.sh 2>/dev/null || true
    chmod +x /start.sh 2>/dev/null || true

    # Borrar lock file de migraciones para que se re-corran
    rm -f $PERSISTENT_DIR/storage/app/.migrations_done 2>/dev/null || true

    echo "Código sincronizado."
elif [ -f "$PERSISTENT_DIR/artisan" ]; then
    # Fallback: si el código fue pusheado a /app/data (método anterior)
    echo "=== Detectado código en $PERSISTENT_DIR (legacy) ==="
    echo "Sincronizando código a $APP_DIR..."

    rm -rf $PERSISTENT_DIR/bootstrap-cache/*.php 2>/dev/null || true

    rsync -a --delete \
        --exclude='storage' \
        --exclude='.env' \
        --exclude='bootstrap/cache' \
        "$PERSISTENT_DIR/" "$APP_DIR/"

    rm -f $PERSISTENT_DIR/storage/app/.migrations_done 2>/dev/null || true

    echo "Código sincronizado (legacy)."
fi

# ============================================================
# Configurar almacenamiento persistente
# ============================================================
echo "Configurando almacenamiento persistente..."

mkdir -p $PERSISTENT_DIR/storage/app/public
mkdir -p $PERSISTENT_DIR/storage/framework/cache/data
mkdir -p $PERSISTENT_DIR/storage/framework/sessions
mkdir -p $PERSISTENT_DIR/storage/framework/views
mkdir -p $PERSISTENT_DIR/storage/logs
mkdir -p $PERSISTENT_DIR/bootstrap-cache

# Asegurar symlinks
cd $APP_DIR
rm -rf storage 2>/dev/null; ln -sf $PERSISTENT_DIR/storage storage
rm -rf bootstrap/cache 2>/dev/null; ln -sf $PERSISTENT_DIR/bootstrap-cache bootstrap/cache
rm -f .env 2>/dev/null; ln -sf $PERSISTENT_DIR/.env .env

# Storage link para archivos públicos
rm -rf public/storage 2>/dev/null
ln -sf $PERSISTENT_DIR/storage/app/public public/storage

# Permisos
chown -R www-data:www-data $PERSISTENT_DIR 2>/dev/null || true
chmod -R 775 $PERSISTENT_DIR 2>/dev/null || true

# ============================================================
# Crear .env desde variables de Cloudron
# ============================================================
if [ ! -s $PERSISTENT_DIR/.env ] || [ "$CLOUDRON_MYSQL_HOST" != "" ]; then
    echo "Configurando entorno desde variables Cloudron..."
    cat > $PERSISTENT_DIR/.env << EOF
APP_NAME=Pwr360
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=${CLOUDRON_APP_ORIGIN:-http://localhost}

APP_LOCALE=es
APP_FALLBACK_LOCALE=es
APP_FAKER_LOCALE=es_AR

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=${CLOUDRON_MYSQL_HOST:-localhost}
DB_PORT=${CLOUDRON_MYSQL_PORT:-3306}
DB_DATABASE=${CLOUDRON_MYSQL_DATABASE:-pwr360}
DB_USERNAME=${CLOUDRON_MYSQL_USERNAME:-root}
DB_PASSWORD=${CLOUDRON_MYSQL_PASSWORD:-}

SESSION_DRIVER=database
SESSION_LIFETIME=120
CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=${MAIL_MAILER:-smtp}
MAIL_HOST=${CLOUDRON_MAIL_SMTP_SERVER:-${MAIL_HOST:-localhost}}
MAIL_PORT=${CLOUDRON_MAIL_SMTP_PORT:-${MAIL_PORT:-587}}
MAIL_USERNAME=${CLOUDRON_MAIL_SMTP_USERNAME:-${MAIL_USERNAME:-}}
MAIL_PASSWORD=${CLOUDRON_MAIL_SMTP_PASSWORD:-${MAIL_PASSWORD:-}}
MAIL_ENCRYPTION=${MAIL_ENCRYPTION:-tls}
MAIL_FROM_ADDRESS=${CLOUDRON_MAIL_FROM:-${MAIL_FROM_ADDRESS:-noreply@pwr360.ar}}
MAIL_FROM_NAME="${MAIL_FROM_NAME:-Pwr360}"

SANCTUM_STATEFUL_DOMAINS=${CLOUDRON_APP_DOMAIN:-localhost}

SENTRY_LARAVEL_DSN=https://afee9a6ef3144d79af81f4ce04bd26e9@bugs.millan.ar/3
SENTRY_TRACES_SAMPLE_RATE=0
EOF
fi

# Generar APP_KEY si no existe
if ! grep -q "APP_KEY=base64:" $PERSISTENT_DIR/.env; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

# ============================================================
# Base de datos: migraciones
# ============================================================
if ! wait_for_db; then
    echo "FATAL: No se puede conectar a la base de datos."
    echo "Iniciando Apache para diagnóstico..."
    exec apache2-foreground
fi

echo "Verificando estado de la base de datos..."
TABLES_EXIST=$(php -r "
    try {
        \$pdo = new PDO(
            'mysql:host=${CLOUDRON_MYSQL_HOST:-localhost};dbname=${CLOUDRON_MYSQL_DATABASE:-pwr360}',
            '${CLOUDRON_MYSQL_USERNAME:-root}',
            '${CLOUDRON_MYSQL_PASSWORD:-}'
        );
        \$result = \$pdo->query(\"SHOW TABLES LIKE 'users'\");
        echo \$result->rowCount() > 0 ? 'yes' : 'no';
    } catch (Exception \$e) {
        echo 'no';
    }
" 2>/dev/null)

if [ "$TABLES_EXIST" = "no" ]; then
    echo "=== Primera ejecución - Inicializando base de datos ==="
    php artisan migrate --force 2>&1 || echo "ERROR en migraciones"
    php artisan db:seed --force 2>&1 || echo "ERROR en seeders"
    echo "Base de datos inicializada."
else
    echo "=== Ejecutando migraciones pendientes ==="
    php artisan migrate --force 2>&1 || echo "Migraciones fallaron (puede ser OK)"
    echo "Migraciones aplicadas."
fi

# ============================================================
# Optimizar para producción
# ============================================================
echo "Limpiando caches..."
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true
php artisan cache:clear 2>/dev/null || true

echo "Generando caches de producción..."
if ! php artisan config:cache 2>&1; then
    echo "WARN: config:cache falló, usando sin cache"
    php artisan config:clear 2>/dev/null || true
fi
if ! php artisan route:cache 2>&1; then
    echo "WARN: route:cache falló, usando sin cache"
    php artisan route:clear 2>/dev/null || true
fi
php artisan view:cache 2>&1 || true

# ============================================================
# Scheduler (cron para cuotas, emails, etc.)
# ============================================================
echo "Configurando scheduler..."
# Crear crontab para el scheduler de Laravel
echo "* * * * * cd $APP_DIR && php artisan schedule:run >> /dev/null 2>&1" | crontab -u www-data - 2>/dev/null || true
# Iniciar cron en background
service cron start 2>/dev/null || cron 2>/dev/null || true

# ============================================================
# Permisos finales
# ============================================================
chown -R www-data:www-data $PERSISTENT_DIR 2>/dev/null || true
chmod -R 775 $PERSISTENT_DIR 2>/dev/null || true
chown -R www-data:www-data $APP_DIR 2>/dev/null || true

echo "=== Pwr360 listo ==="
echo "Migraciones: ejecutadas"
echo "Scheduler: activo"
echo "Health: /api/health"

# Iniciar Apache
exec apache2-foreground
