#!/bin/bash
# Start script para Pwr360 en Cloudron
# Auto-inicializa Laravel en primer inicio

cd /var/www/html

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

    echo "ERROR: No se pudo conectar a la base de datos después de $max_attempts intentos."
    return 1
}

# Configurar almacenamiento persistente
# Los symlinks ya están creados en la imagen Docker apuntando a /app/data
PERSISTENT_DIR="/app/data"

echo "=== Diagnóstico de almacenamiento ==="
echo "Verificando $PERSISTENT_DIR..."
ls -la / | grep -E "app|data" || echo "No se encontró /app o /data en /"
ls -la /app/ 2>/dev/null || echo "/app no existe"
ls -la $PERSISTENT_DIR 2>/dev/null || echo "$PERSISTENT_DIR no existe"
echo "Symlinks en /var/www/html:"
ls -la /var/www/html/.env /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true
echo "=== Fin diagnóstico ==="

# Verificar si /app/data existe
if [ ! -d "$PERSISTENT_DIR" ]; then
    echo "ERROR: $PERSISTENT_DIR no existe! Creando..."
    mkdir -p $PERSISTENT_DIR 2>/dev/null || {
        echo "FATAL: No se puede crear $PERSISTENT_DIR - filesystem read-only"
        echo "Intentando usar /tmp como fallback..."
        PERSISTENT_DIR="/tmp/pwr360-data"
        mkdir -p $PERSISTENT_DIR
        # Recrear symlinks a /tmp
        rm -f /var/www/html/storage 2>/dev/null || true
        rm -f /var/www/html/bootstrap/cache 2>/dev/null || true
        rm -f /var/www/html/.env 2>/dev/null || true
        ln -sf $PERSISTENT_DIR/storage /var/www/html/storage
        ln -sf $PERSISTENT_DIR/bootstrap-cache /var/www/html/bootstrap/cache
        ln -sf $PERSISTENT_DIR/.env /var/www/html/.env
    }
fi

echo "Configurando almacenamiento persistente en $PERSISTENT_DIR..."

# Crear estructura completa de storage en persistente
mkdir -p $PERSISTENT_DIR/storage/app/public
mkdir -p $PERSISTENT_DIR/storage/framework/cache/data
mkdir -p $PERSISTENT_DIR/storage/framework/sessions
mkdir -p $PERSISTENT_DIR/storage/framework/views
mkdir -p $PERSISTENT_DIR/storage/logs
mkdir -p $PERSISTENT_DIR/bootstrap-cache

# Crear .env si no existe
touch $PERSISTENT_DIR/.env

# Asegurar permisos
chown -R www-data:www-data $PERSISTENT_DIR 2>/dev/null || true
chmod -R 775 $PERSISTENT_DIR 2>/dev/null || true

echo "Almacenamiento persistente configurado en $PERSISTENT_DIR"
ls -la $PERSISTENT_DIR/

# Crear .env desde variables de Cloudron
if [ ! -s .env ] || [ "$CLOUDRON_MYSQL_HOST" != "" ]; then
    echo "Configurando entorno desde variables Cloudron..."
    cat > .env << EOF
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
EOF
fi

# Generar APP_KEY si no existe
if ! grep -q "APP_KEY=base64:" .env; then
    echo "Generando APP_KEY..."
    php artisan key:generate --force
fi

# Esperar que la DB esté lista antes de continuar
if ! wait_for_db; then
    echo "FATAL: No se puede iniciar sin conexión a la base de datos."
    echo "Iniciando Apache de todas formas para permitir diagnóstico..."
    exec apache2-foreground
fi

# Verificar si las tablas existen
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
    echo "Primera ejecución - Inicializando base de datos..."

    if php artisan migrate --force; then
        echo "Migraciones completadas."
    else
        echo "ERROR en migraciones, pero continuando..."
    fi

    if php artisan db:seed --force; then
        echo "Seeders completados."
    else
        echo "ERROR en seeders, pero continuando..."
    fi

    echo "Base de datos inicializada."
else
    echo "Ejecutando migraciones pendientes..."
    php artisan migrate --force || echo "Migraciones fallaron, continuando..."
    echo "Migraciones aplicadas."
fi

# Crear link simbólico de storage
if [ ! -L public/storage ]; then
    rm -rf public/storage 2>/dev/null || true
    php artisan storage:link 2>/dev/null || true
fi

# Limpiar cache antes de regenerar
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

# Optimizar para producción (sin fallar si hay error)
php artisan config:cache || echo "Config cache falló"
php artisan route:cache || echo "Route cache falló"
php artisan view:cache || echo "View cache falló"

# Asegurar permisos (storage y bootstrap/cache son symlinks a persistente)
if [ -n "$PERSISTENT_DIR" ]; then
    chown -R www-data:www-data $PERSISTENT_DIR
    chmod -R 775 $PERSISTENT_DIR
fi

if [ -L public/storage ]; then
    chown -h www-data:www-data public/storage
fi

echo "=== Pwr360 listo ==="
echo "Health check disponible en /api/health"

# Iniciar Apache
exec apache2-foreground
