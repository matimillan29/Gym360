# Pwr360 - Sistema de Gestión para Gimnasios

Sistema de administración de gimnasios con planes de entrenamiento periodizados, seguimiento de progresión, cuotas y evaluaciones.

## Stack Tecnológico

- **Frontend:** React (PWA)
- **Backend:** Laravel 11 (PHP 8.2+)
- **Base de datos:** MySQL/MariaDB
- **Servidor:** Docker / Cloudron

## Despliegue en Cloudron

### Opción 1: Docker Personalizado (Recomendado)

1. **Crear imagen Docker**
```bash
docker build -t pwr360 .
```

2. **Subir a Cloudron**
```bash
# Usando cloudron CLI
cloudron push --image pwr360
```

3. **Instalar en Cloudron**
- Ir a "Install App" > "Custom App"
- Seleccionar la imagen `pwr360`
- Cloudron provee automáticamente MySQL y variables de entorno

La app se auto-inicializa en el primer inicio:
- Configura `.env` desde variables de Cloudron
- Ejecuta migraciones
- Carga ejercicios predefinidos

### Opción 2: LAMP de Cloudron

1. **Compilar para deploy**
```bash
./build-for-cloudron.sh
```

2. **Subir a Cloudron LAMP**
- Subir contenido de `cloudron-deploy/` a `/app/data/`

3. **Ejecutar instalación**
```bash
cd /app/data
./install.sh
```

## Desarrollo Local

### Requisitos
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL/MariaDB

### Instalación

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# Frontend
cd frontend
npm install
npm run dev
```

### Ejecutar

```bash
# Backend (terminal 1)
cd backend
php artisan serve

# Frontend (terminal 2)
cd frontend
npm run dev
```

## Variables de Entorno (Cloudron)

Cloudron inyecta automáticamente:
- `CLOUDRON_MYSQL_HOST`, `CLOUDRON_MYSQL_PORT`, etc.
- `CLOUDRON_MAIL_SMTP_SERVER`, `CLOUDRON_MAIL_FROM`, etc.
- `CLOUDRON_APP_ORIGIN`, `CLOUDRON_APP_DOMAIN`

## Solución de Problemas

### Ver logs
```bash
# En Cloudron
tail -f /var/www/html/storage/logs/laravel.log

# O en terminal web
docker logs <container_id>
```

### Limpiar caché
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Reset de base de datos (¡borra todo!)
```bash
php artisan migrate:fresh --seed
```

## Licencia

Privado - Todos los derechos reservados.
