<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login para entrenadores (email + password)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->password || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales son incorrectas.'],
            ]);
        }

        if (!$user->isEntrenador()) {
            throw ValidationException::withMessages([
                'email' => ['Este acceso es solo para entrenadores.'],
            ]);
        }

        if ($user->estado !== 'activo') {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está desactivada.'],
            ]);
        }

        // Revocar tokens anteriores
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Solicitar código OTP para entrenados
     */
    public function requestOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)
            ->where('role', 'entrenado')
            ->first();

        if (!$user) {
            // No revelamos si el email existe o no por seguridad
            return response()->json([
                'message' => 'Si el email está registrado, recibirás un código de acceso.',
            ]);
        }

        if ($user->estado !== 'activo') {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está desactivada.'],
            ]);
        }

        // Rate limiting: máximo 3 códigos por hora
        $recentCodes = OtpCode::where('user_id', $user->id)
            ->where('created_at', '>', now()->subHour())
            ->count();

        if ($recentCodes >= 3) {
            throw ValidationException::withMessages([
                'email' => ['Demasiados intentos. Esperá un momento antes de solicitar otro código.'],
            ]);
        }

        // Generar código OTP
        $otp = OtpCode::generateFor($user);

        // Enviar email (por ahora solo log, después configurar SMTP)
        // Mail::to($user->email)->send(new OtpLoginMail($otp->code));

        // Por ahora logueamos el código para testing
        \Log::info("OTP Code for {$user->email}: {$otp->code}");

        return response()->json([
            'message' => 'Si el email está registrado, recibirás un código de acceso.',
            // Solo en desarrollo, quitar en producción:
            'debug_code' => config('app.debug') ? $otp->code : null,
        ]);
    }

    /**
     * Verificar código OTP
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)
            ->where('role', 'entrenado')
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido o expirado.'],
            ]);
        }

        $otp = OtpCode::where('user_id', $user->id)
            ->where('code', $request->code)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$otp) {
            throw ValidationException::withMessages([
                'code' => ['Código inválido o expirado.'],
            ]);
        }

        // Marcar código como usado
        $otp->markAsUsed();

        // Revocar tokens anteriores
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Obtener usuario actual
     */
    public function user(Request $request)
    {
        return response()->json([
            'data' => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * Formatear usuario para respuesta
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'nombre' => $user->nombre,
            'apellido' => $user->apellido,
            'dni' => $user->dni,
            'telefono' => $user->telefono,
            'fecha_nacimiento' => $user->fecha_nacimiento?->format('Y-m-d'),
            'profesion' => $user->profesion,
            'foto' => $user->foto,
            'estado' => $user->estado,
            'entrenador_asignado_id' => $user->entrenador_asignado_id,
            'created_at' => $user->created_at->toISOString(),
            'updated_at' => $user->updated_at->toISOString(),
        ];
    }
}
