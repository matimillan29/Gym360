<?php
/**
 * Cloudron LAMP Initialization Script
 *
 * Este script se ejecuta automáticamente desde index.php
 * para configurar Laravel con las variables de entorno de Cloudron
 */

// Solo ejecutar si estamos en Cloudron (detectar por variable de entorno)
if (!getenv('CLOUDRON_MYSQL_HOST') && !getenv('MYSQL_HOST')) {
    return; // No estamos en Cloudron LAMP
}

$envFile = __DIR__ . '/.env';
$envExampleFile = __DIR__ . '/.env.example';

// Si no existe .env, crearlo desde las variables de Cloudron
if (!file_exists($envFile)) {

    // Variables de MySQL de Cloudron LAMP
    $dbHost = getenv('CLOUDRON_MYSQL_HOST') ?: getenv('MYSQL_HOST') ?: 'localhost';
    $dbPort = getenv('CLOUDRON_MYSQL_PORT') ?: getenv('MYSQL_PORT') ?: '3306';
    $dbName = getenv('CLOUDRON_MYSQL_DATABASE') ?: getenv('MYSQL_DATABASE') ?: 'lamp';
    $dbUser = getenv('CLOUDRON_MYSQL_USERNAME') ?: getenv('MYSQL_USERNAME') ?: 'lamp';
    $dbPass = getenv('CLOUDRON_MYSQL_PASSWORD') ?: getenv('MYSQL_PASSWORD') ?: '';

    // Variables de SMTP de Cloudron
    $mailHost = getenv('CLOUDRON_MAIL_SMTP_SERVER') ?: getenv('MAIL_SMTP_SERVER') ?: '';
    $mailPort = getenv('CLOUDRON_MAIL_SMTP_PORT') ?: getenv('MAIL_SMTP_PORT') ?: '587';
    $mailUser = getenv('CLOUDRON_MAIL_SMTP_USERNAME') ?: getenv('MAIL_SMTP_USERNAME') ?: '';
    $mailPass = getenv('CLOUDRON_MAIL_SMTP_PASSWORD') ?: getenv('MAIL_SMTP_PASSWORD') ?: '';
    $mailFrom = getenv('CLOUDRON_MAIL_FROM') ?: getenv('MAIL_FROM') ?: 'noreply@example.com';
    $mailFromName = getenv('CLOUDRON_MAIL_FROM_DISPLAY_NAME') ?: getenv('APP_NAME') ?: 'Pwr360';

    // URL de la app
    $appUrl = getenv('CLOUDRON_APP_ORIGIN') ?: getenv('APP_URL') ?: 'http://localhost';

    // Generar APP_KEY
    $appKey = 'base64:' . base64_encode(random_bytes(32));

    $envContent = <<<ENV
APP_NAME=Pwr360
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_URL={$appUrl}

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST={$dbHost}
DB_PORT={$dbPort}
DB_DATABASE={$dbName}
DB_USERNAME={$dbUser}
DB_PASSWORD={$dbPass}

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MAIL_MAILER=smtp
MAIL_HOST={$mailHost}
MAIL_PORT={$mailPort}
MAIL_USERNAME={$mailUser}
MAIL_PASSWORD={$mailPass}
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="{$mailFrom}"
MAIL_FROM_NAME="{$mailFromName}"

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
SESSION_DOMAIN=
ENV;

    file_put_contents($envFile, $envContent);

    // Dar permisos
    chmod($envFile, 0640);
}

// Asegurar que los directorios de storage existen
$storageDirs = [
    __DIR__ . '/storage/app/public',
    __DIR__ . '/storage/framework/cache/data',
    __DIR__ . '/storage/framework/sessions',
    __DIR__ . '/storage/framework/views',
    __DIR__ . '/storage/logs',
    __DIR__ . '/bootstrap/cache',
];

foreach ($storageDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

// Correr migraciones cuando el código cambia
// Usa el mtime de artisan como proxy para detectar nuevos deploys
$lockFile = __DIR__ . '/storage/app/.last_migration_run';
$artisanMtime = @filemtime(__DIR__ . '/artisan');
$lastRun = file_exists($lockFile) ? (int)trim(file_get_contents($lockFile)) : 0;

if ($artisanMtime && $artisanMtime > $lastRun) {
    $output = [];
    $returnCode = 0;
    $currentDir = getcwd();
    chdir(__DIR__);

    // Limpiar caches antes de migrar para evitar errores con cache vieja
    $artisan = __DIR__ . '/artisan';
    $php = PHP_BINARY;

    $clearCmds = ['config:clear', 'route:clear', 'view:clear'];
    foreach ($clearCmds as $cmd) {
        $cmdOutput = [];
        @exec(escapeshellarg($php) . ' ' . escapeshellarg($artisan) . ' ' . $cmd . ' 2>&1', $cmdOutput);
    }

    // Ejecutar migraciones pendientes
    $migrateOutput = [];
    @exec(escapeshellarg($php) . ' ' . escapeshellarg($artisan) . ' migrate --force 2>&1', $migrateOutput, $returnCode);

    if ($returnCode === 0) {
        // Crear link de storage
        @exec(escapeshellarg($php) . ' ' . escapeshellarg($artisan) . ' storage:link --force 2>&1');

        // Marcar como completado
        @file_put_contents($lockFile, (string)$artisanMtime);
    } else {
        @file_put_contents(
            __DIR__ . '/storage/logs/migration_error.log',
            date('Y-m-d H:i:s') . "\n" . implode("\n", $migrateOutput)
        );
    }

    chdir($currentDir);
}
