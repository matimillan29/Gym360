<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class GymConfig extends Model
{
    protected $table = 'gym_config';

    protected $fillable = [
        'nombre',
        'logo',
        'color_principal',
        'color_secundario',
        'multi_sucursal',
        'direccion',
        'telefono',
        'email',
        'redes_sociales',
        'dias_aviso_vencimiento',
        'notificar_vencimiento',
        'notificar_nuevo_plan',
        // SMTP config
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'smtp_encryption',
        'smtp_from_address',
        'smtp_from_name',
    ];

    protected $hidden = [
        'smtp_password',
    ];

    protected function casts(): array
    {
        return [
            'redes_sociales' => 'array',
            'multi_sucursal' => 'boolean',
            'notificar_vencimiento' => 'boolean',
            'notificar_nuevo_plan' => 'boolean',
        ];
    }

    // Encriptar password al guardar
    public function setSmtpPasswordAttribute($value)
    {
        if ($value) {
            $this->attributes['smtp_password'] = Crypt::encryptString($value);
        }
    }

    // Desencriptar password al leer
    public function getSmtpPasswordDecryptedAttribute(): ?string
    {
        if ($this->smtp_password) {
            try {
                return Crypt::decryptString($this->smtp_password);
            } catch (\Exception $e) {
                return null;
            }
        }
        return null;
    }

    public static function get(): ?self
    {
        return self::first();
    }

    public static function isConfigured(): bool
    {
        return self::exists();
    }

    /**
     * Obtener URL absoluta del logo para usar en emails
     */
    public function getLogoAbsoluteUrlAttribute(): ?string
    {
        if (!$this->logo) {
            return null;
        }

        // Si ya es una URL absoluta, devolverla tal cual
        if (str_starts_with($this->logo, 'http://') || str_starts_with($this->logo, 'https://')) {
            return $this->logo;
        }

        // Construir URL absoluta
        $baseUrl = rtrim(config('app.url'), '/');
        return $baseUrl . $this->logo;
    }

    /**
     * Aplicar configuración SMTP dinámica
     * Prioridad: 1) Variables Cloudron LAMP, 2) Config DB, 3) .env
     */
    public function applySmtpConfig(): void
    {
        // Primero intentar con variables de Cloudron LAMP
        $cloudronSmtp = env('CLOUDRON_MAIL_SMTP_SERVER');

        if ($cloudronSmtp) {
            config([
                'mail.mailers.smtp.host' => $cloudronSmtp,
                'mail.mailers.smtp.port' => env('CLOUDRON_MAIL_SMTP_PORT', 587),
                'mail.mailers.smtp.username' => env('CLOUDRON_MAIL_SMTP_USERNAME'),
                'mail.mailers.smtp.password' => env('CLOUDRON_MAIL_SMTP_PASSWORD'),
                'mail.mailers.smtp.encryption' => 'tls',
                'mail.from.address' => env('CLOUDRON_MAIL_FROM', $this->email),
                'mail.from.name' => $this->smtp_from_name ?? $this->nombre,
            ]);
            return;
        }

        // Si no hay Cloudron, usar config de la DB
        if ($this->smtp_host) {
            config([
                'mail.mailers.smtp.host' => $this->smtp_host,
                'mail.mailers.smtp.port' => $this->smtp_port ?? 587,
                'mail.mailers.smtp.username' => $this->smtp_username,
                'mail.mailers.smtp.password' => $this->smtp_password_decrypted,
                'mail.mailers.smtp.encryption' => $this->smtp_encryption ?? 'tls',
                'mail.from.address' => $this->smtp_from_address ?? $this->email,
                'mail.from.name' => $this->smtp_from_name ?? $this->nombre,
            ]);
        }
    }

    /**
     * Verificar si hay configuración SMTP disponible (Cloudron o DB)
     */
    public static function hasSmtpConfig(): bool
    {
        // Cloudron LAMP
        if (env('CLOUDRON_MAIL_SMTP_SERVER')) {
            return true;
        }

        // DB config
        $config = self::get();
        return $config && $config->smtp_host;
    }

    /**
     * Obtener origen de la configuración SMTP actual
     */
    public static function getSmtpSource(): string
    {
        if (env('CLOUDRON_MAIL_SMTP_SERVER')) {
            return 'cloudron';
        }

        $config = self::get();
        if ($config && $config->smtp_host) {
            return 'database';
        }

        return 'env';
    }
}
