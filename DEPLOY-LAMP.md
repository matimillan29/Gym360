# Despliegue de Pwr360 en Cloudron LAMP

## Estructura en Cloudron LAMP

```
/app/data/           <- Raiz de Laravel
├── app/
├── bootstrap/
├── config/
├── database/
├── public/          <- DocumentRoot de Apache
│   ├── index.php
│   ├── app.html
│   └── assets/
├── resources/
├── routes/
├── storage/
├── vendor/
├── .env             <- Se crea automaticamente
└── cloudron-init.php
```

## Scripts disponibles

| Script | Uso |
|--------|-----|
| `./build-for-lamp.sh` | Build completo (primera vez o cambios en composer) |
| `./sync-lamp.sh` | Sincronizar cambios de codigo (uso diario) |

## Primera instalacion

```bash
# 1. Generar build completo
./build-for-lamp.sh

# 2. Subir por SFTP el contenido de lamp-build/ a /app/data/

# 3. En el terminal del LAMP, ajustar permisos:
cd /app/data
chown -R www-data:www-data .
chmod -R 775 storage bootstrap/cache
```

La primera vez que accedas al URL:
- Se crea `.env` automaticamente con las variables de Cloudron
- Se ejecutan las migraciones
- Se cargan los seeders
- Aparece el wizard de setup

## Actualizaciones (uso diario)

```bash
# 1. Sincronizar cambios
./sync-lamp.sh

# 2. Subir por SFTP el contenido de lamp-build/ a /app/data/
```

### Si solo cambiaste frontend

Subir solo:
- `lamp-build/public/assets/` -> `/app/data/public/assets/`
- `lamp-build/public/app.html` -> `/app/data/public/app.html`

### Si solo cambiaste backend

Subir los archivos modificados. Ejemplos:
- `lamp-build/app/Http/Controllers/` -> `/app/data/app/Http/Controllers/`
- `lamp-build/routes/api.php` -> `/app/data/routes/api.php`

### Despues de subir cambios de backend

```bash
# En el terminal del LAMP
cd /app/data
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Si agregaste migraciones

```bash
cd /app/data
php artisan migrate --force
```

## Cambios en dependencias (composer)

Si modificas `composer.json`, ejecuta el build completo:

```bash
./build-for-lamp.sh
```

Y subi todo `lamp-build/` incluyendo `vendor/`.

## Variables de entorno

El script `cloudron-init.php` detecta automaticamente:
- `CLOUDRON_MYSQL_*` - Base de datos
- `CLOUDRON_MAIL_SMTP_*` - Email
- `CLOUDRON_APP_ORIGIN` - URL de la app

No necesitas configurar nada manualmente.

## Requisitos

- PHP 8.3 en el LAMP de Cloudron
- Node.js en tu maquina local (para compilar frontend)
- Composer en tu maquina local
