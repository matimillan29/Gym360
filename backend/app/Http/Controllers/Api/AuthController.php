<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OtpCode;
use App\Models\GymConfig;
use App\Mail\OtpMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        // Enviar email con código OTP
        try {
            // Aplicar config SMTP si existe
            $config = GymConfig::get();
            if ($config) {
                $config->applySmtpConfig();
            }

            Mail::to($user->email)->send(new OtpMail($otp->code, $user->nombre));
            \Log::info("OTP Code sent to {$user->email}");
        } catch (\Exception $e) {
            \Log::error("Error sending OTP email: " . $e->getMessage());
            // En desarrollo mostramos el código aunque falle el email
            if (config('app.debug')) {
                \Log::info("OTP Code for {$user->email}: {$otp->code}");
            }
        }

        return response()->json([
            'message' => 'Si el email está registrado, recibirás un código de acceso.',
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

        $email = $request->email;

        // Brute force protection: max 5 failed attempts per email in 10 minutes
        $attemptsKey = "otp_attempts:{$email}";
        $attempts = Cache::get($attemptsKey, 0);

        if ($attempts >= 5) {
            throw ValidationException::withMessages([
                'code' => ['Demasiados intentos fallidos. Esperá unos minutos antes de reintentar.'],
            ]);
        }

        $user = User::where('email', $email)
            ->where('role', 'entrenado')
            ->first();

        if (!$user) {
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(10));
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
            Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(10));
            throw ValidationException::withMessages([
                'code' => ['Código inválido o expirado.'],
            ]);
        }

        // Éxito: limpiar contador de intentos
        Cache::forget($attemptsKey);

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
     * Login para entrenados (email + password)
     * ADVERTENCIA: Este método usa una fórmula predecible (primeras 2 letras nombre + 2 letras apellido + DNI).
     * Es una conveniencia temporal; se recomienda migrar a OTP o contraseñas reales.
     */
    public function loginEntrenado(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:5',
        ]);

        // Rate limiting: max 10 intentos por IP por minuto
        $ip = $request->ip();
        $rateLimitKey = "login_entrenado_attempts:{$ip}";
        $loginAttempts = Cache::get($rateLimitKey, 0);

        if ($loginAttempts >= 10) {
            throw ValidationException::withMessages([
                'email' => ['Demasiados intentos. Esperá un momento antes de reintentar.'],
            ]);
        }

        // Buscar entrenado por email
        $user = User::where('email', $request->email)
            ->where('role', 'entrenado')
            ->first();

        if (!$user) {
            Cache::put($rateLimitKey, $loginAttempts + 1, now()->addMinute());
            throw ValidationException::withMessages([
                'email' => ['Credenciales incorrectas.'],
            ]);
        }

        // Generar la contraseña esperada: MaMi + DNI
        $expectedPassword = $this->generateUsername($user->nombre, $user->apellido) . $user->dni;

        // Comparar contraseña (case insensitive para el usuario, exacto para DNI)
        $inputPassword = $request->password;
        $inputUsuario = mb_substr($inputPassword, 0, 4);
        $inputDni = mb_substr($inputPassword, 4);

        $expectedUsuario = $this->generateUsername($user->nombre, $user->apellido);

        if (strtolower($inputUsuario) !== strtolower($expectedUsuario) || $inputDni !== $user->dni) {
            Cache::put($rateLimitKey, $loginAttempts + 1, now()->addMinute());
            throw ValidationException::withMessages([
                'password' => ['Credenciales incorrectas.'],
            ]);
        }

        if ($user->estado !== 'activo') {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está desactivada.'],
            ]);
        }

        // Éxito: limpiar contador de intentos
        Cache::forget($rateLimitKey);

        // Revocar tokens anteriores
        $user->tokens()->delete();

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Generar nombre de usuario a partir de nombre y apellido
     * Primeras 2 letras del nombre + Primeras 2 letras del apellido
     * Primera letra de cada parte en mayúscula, segunda en minúscula
     */
    private function generateUsername(string $nombre, string $apellido): string
    {
        $nombre = trim($nombre);
        $apellido = trim($apellido);

        $n1 = mb_strtoupper(mb_substr($nombre, 0, 1));
        $n2 = mb_strtolower(mb_substr($nombre, 1, 1));
        $a1 = mb_strtoupper(mb_substr($apellido, 0, 1));
        $a2 = mb_strtolower(mb_substr($apellido, 1, 1));

        return $n1 . $n2 . $a1 . $a2;
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
            'usuario' => $user->role === 'entrenado' ? $this->generateUsername($user->nombre, $user->apellido) : null,
        ];
    }
}
