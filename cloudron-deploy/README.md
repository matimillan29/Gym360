# Pwr360 - Despliegue en Cloudron LAMP

## Estructura de Cloudron LAMP
```
/app/
├── public/          ← Document Root (aquí va public/ de Laravel + frontend)
├── apache/          ← Configuración de Apache (no tocar)
├── app/             ← Código PHP de Laravel
├── bootstrap/
├── config/
├── database/
├── resources/
├── routes/
├── storage/
├── vendor/          ← Se crea con composer install
├── .env
├── artisan
├── composer.json
└── install.sh
```

## Instalación

### Paso 1: Subir archivos
1. Acceder al File Manager de tu app LAMP en Cloudron
2. Subir TODO el contenido de esta carpeta a `/app/`
   - La carpeta `public/` va a `/app/public/` (reemplaza el contenido existente)
   - El resto de archivos/carpetas van a `/app/`

### Paso 2: Ejecutar instalación
1. Abrir la Terminal (Web Terminal) de la app LAMP
2. Ejecutar:
```bash
cd /app
./install.sh
```

### Paso 3: Configurar la aplicación
1. Acceder a tu dominio de Cloudron
2. Completar el wizard de instalación:
   - Nombre del gimnasio
   - Logo (opcional)
   - Color principal
   - Datos del administrador

## Variables de entorno
Cloudron provee automáticamente:
- `CLOUDRON_MYSQL_*` - Base de datos
- `CLOUDRON_MAIL_*` - SMTP para emails

## Solución de problemas

### Error 500
```bash
cd /app
tail -f storage/logs/laravel.log
chmod -R 775 storage bootstrap/cache
```

### Limpiar caché
```bash
cd /app
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Re-ejecutar migraciones (¡borra datos!)
```bash
cd /app
php artisan migrate:fresh --seed --force
```
