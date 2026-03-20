<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TestMail;
use App\Models\GymConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class ConfigController extends Controller
{
    /**
     * Obtener configuración pública del gimnasio (para login page, sin auth)
     */
    public function showPublic()
    {
        try {
            $config = GymConfig::get();
        } catch (\Throwable $e) {
            // Tabla no existe aún (primera ejecución, migraciones no corrieron)
            return response()->json([
                'data' => null,
                'is_configured' => false,
            ]);
        }

        if (!$config) {
            return response()->json([
                'data' => null,
                'is_configured' => false,
            ]);
        }

        // Solo devolver datos públicos (no sensibles)
        return response()->json([
            'data' => [
                'nombre' => $config->nombre,
                'logo' => $config->logo,
                'color_principal' => $config->color_principal,
                'color_secundario' => $config->color_secundario,
            ],
            'is_configured' => true,
        ]);
    }

    /**
     * Obtener configuración completa del gimnasio (requiere auth admin)
     */
    public function show()
    {
        $config = GymConfig::get();

        if (!$config) {
            return response()->json([
                'data' => null,
            ]);
        }

        return response()->json([
            'data' => $config,
        ]);
    }

    /**
     * Actualizar configuración del gimnasio
     */
    public function update(Request $request)
    {
        $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'color_principal' => 'sometimes|string|max:7',
            'color_secundario' => 'sometimes|string|max:7',
            'multi_sucursal' => 'sometimes|boolean',
            'direccion' => 'nullable|string|max:255',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'redes_sociales' => 'nullable|array',
            'dias_aviso_vencimiento' => 'sometimes|integer|min:1|max:30',
            'notificar_vencimiento' => 'sometimes|boolean',
            'notificar_nuevo_plan' => 'sometimes|boolean',
        ]);

        $config = GymConfig::get();

        if (!$config) {
            return response()->json([
                'message' => 'Configuración no encontrada.',
            ], 404);
        }

        $config->update($request->only([
            'nombre',
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
        ]));

        return response()->json([
            'data' => $config,
            'message' => 'Configuración actualizada correctamente.',
        ]);
    }

    /**
     * Actualizar logo del gimnasio
     */
    public function updateLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|max:2048',
        ]);

        $config = GymConfig::get();

        if (!$config) {
            return response()->json([
                'message' => 'Configuración no encontrada.',
            ], 404);
        }

        // Eliminar logo anterior si existe
        if ($config->logo) {
            $oldPath = str_replace('/storage/', '', $config->logo);
            Storage::disk('public')->delete($oldPath);
        }

        // Guardar nuevo logo
        $logoPath = $request->file('logo')->store('gym', 'public');
        $config->update([
            'logo' => Storage::url($logoPath),
        ]);

        return response()->json([
            'data' => $config,
            'message' => 'Logo actualizado correctamente.',
        ]);
    }

    /**
     * Enviar email de prueba al usuario autenticado
     */
    public function testEmail(Request $request)
    {
        $user = $request->user();

        if (!$user || !$user->email) {
            return response()->json([
                'message' => 'No se pudo obtener el email del usuario.',
            ], 400);
        }

        try {
            // Aplicar config SMTP (prioriza Cloudron > DB > .env)
            $config = GymConfig::get();
            if ($config) {
                $config->applySmtpConfig();
            }

            $smtpSource = GymConfig::getSmtpSource();

            Mail::to($user->email)->send(new TestMail());

            return response()->json([
                'message' => 'Email de prueba enviado correctamente a ' . $user->email,
                'smtp_source' => $smtpSource,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al enviar el email: ' . $e->getMessage(),
                'smtp_source' => GymConfig::getSmtpSource(),
            ], 500);
        }
    }

    /**
     * Verificar contraseña de super admin
     */
    public function verifySuperAdmin(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $superPassword = env('SUPER_ADMIN_PASSWORD');

        if ($superPassword === null) {
            return response()->json([
                'valid' => false,
                'message' => 'SUPER_ADMIN_PASSWORD no configurado en el servidor.',
            ], 403);
        }

        if (!hash_equals($superPassword, $request->password)) {
            return response()->json([
                'valid' => false,
                'message' => 'Contraseña incorrecta.',
            ], 401);
        }

        return response()->json([
            'valid' => true,
            'message' => 'Acceso concedido.',
        ]);
    }

    /**
     * Obtener configuración SMTP (sin password)
     */
    public function getSmtpConfig(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $superPassword = env('SUPER_ADMIN_PASSWORD');

        if ($superPassword === null) {
            return response()->json([
                'message' => 'SUPER_ADMIN_PASSWORD no configurado en el servidor.',
            ], 403);
        }

        if (!hash_equals($superPassword, $request->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta.',
            ], 401);
        }

        $config = GymConfig::get();

        return response()->json([
            'data' => [
                'smtp_host' => $config?->smtp_host,
                'smtp_port' => $config?->smtp_port ?? 587,
                'smtp_username' => $config?->smtp_username,
                'smtp_encryption' => $config?->smtp_encryption ?? 'tls',
                'smtp_from_address' => $config?->smtp_from_address,
                'smtp_from_name' => $config?->smtp_from_name,
                'has_password' => !empty($config?->smtp_password),
            ],
        ]);
    }

    /**
     * Guardar configuración SMTP
     */
    public function updateSmtpConfig(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'smtp_host' => 'nullable|string|max:255',
            'smtp_port' => 'nullable|integer|min:1|max:65535',
            'smtp_username' => 'nullable|string|max:255',
            'smtp_password' => 'nullable|string|max:255',
            'smtp_encryption' => 'nullable|string|in:tls,ssl,null',
            'smtp_from_address' => 'nullable|email|max:255',
            'smtp_from_name' => 'nullable|string|max:255',
        ]);

        $superPassword = env('SUPER_ADMIN_PASSWORD');

        if ($superPassword === null) {
            return response()->json([
                'message' => 'SUPER_ADMIN_PASSWORD no configurado en el servidor.',
            ], 403);
        }

        if (!hash_equals($superPassword, $request->password)) {
            return response()->json([
                'message' => 'Contraseña incorrecta.',
            ], 401);
        }

        $config = GymConfig::get();

        if (!$config) {
            return response()->json([
                'message' => 'Configuración no encontrada.',
            ], 404);
        }

        $updateData = $request->only([
            'smtp_host',
            'smtp_port',
            'smtp_username',
            'smtp_encryption',
            'smtp_from_address',
            'smtp_from_name',
        ]);

        // Solo actualizar password si se envía uno nuevo
        if ($request->filled('smtp_password')) {
            $updateData['smtp_password'] = $request->smtp_password;
        }

        $config->update($updateData);

        return response()->json([
            'message' => 'Configuración SMTP guardada correctamente.',
            'data' => [
                'smtp_host' => $config->smtp_host,
                'smtp_port' => $config->smtp_port,
                'smtp_username' => $config->smtp_username,
                'smtp_encryption' => $config->smtp_encryption,
                'smtp_from_address' => $config->smtp_from_address,
                'smtp_from_name' => $config->smtp_from_name,
                'has_password' => !empty($config->smtp_password),
            ],
        ]);
    }
}
