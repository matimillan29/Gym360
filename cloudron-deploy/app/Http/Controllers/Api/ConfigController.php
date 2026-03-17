<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GymConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ConfigController extends Controller
{
    /**
     * Obtener configuración del gimnasio
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
}
