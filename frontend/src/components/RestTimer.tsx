import { useState, useEffect, useCallback, useRef } from 'react';

interface RestTimerProps {
  defaultTime?: number; // tiempo en segundos
  onComplete?: () => void;
}

export default function RestTimer({ defaultTime = 60, onComplete }: RestTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);

  const presets = [30, 60, 90, 120, 180];

  // Crear audio al montar
  useEffect(() => {
    // Crear un beep usando Web Audio API
    audioRef.current = new Audio();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Actualizar tiempo por defecto cuando cambia
  useEffect(() => {
    if (!isRunning) {
      setSelectedTime(defaultTime);
      setTimeLeft(defaultTime);
    }
  }, [defaultTime, isRunning]);

  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.5;

      oscillator.start();

      // 3 beeps
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 200);
      setTimeout(() => {
        oscillator.frequency.value = 1200;
      }, 400);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 600);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playBeep();
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, playBeep, onComplete]);

  const startTimer = (seconds?: number) => {
    const time = seconds || selectedTime;
    setSelectedTime(time);
    setTimeLeft(time);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedTime > 0 ? ((selectedTime - timeLeft) / selectedTime) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // radio de 45

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isRunning
            ? 'bg-green-600 text-white animate-pulse'
            : 'bg-white text-gray-700 border border-gray-200'
        }`}
      >
        {isRunning ? (
          <span className="text-sm font-bold">{formatTime(timeLeft)}</span>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Modal del timer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Timer de Descanso</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Timer circular */}
            <div className="p-8 flex flex-col items-center">
              <div className="relative w-40 h-40">
                {/* Círculo de fondo */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Círculo de progreso */}
                  <circle
                    cx="80"
                    cy="80"
                    r="45"
                    stroke={isRunning ? '#22c55e' : '#3b82f6'}
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Tiempo en el centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Controles */}
              <div className="flex items-center gap-4 mt-6">
                {!isRunning ? (
                  <button
                    onClick={() => startTimer()}
                    className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="w-14 h-14 rounded-full bg-yellow-500 text-white flex items-center justify-center hover:bg-yellow-600 transition-colors"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  className="w-12 h-12 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="px-6 pb-6">
              <p className="text-sm text-gray-500 mb-3 text-center">Tiempo rápido</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {presets.map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => startTimer(seconds)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTime === seconds && !isRunning
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mensaje de estado */}
            {timeLeft === 0 && !isRunning && (
              <div className="px-6 pb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-medium">
                    ¡Descanso terminado! A entrenar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
