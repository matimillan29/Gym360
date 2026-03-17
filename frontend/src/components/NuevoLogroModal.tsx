import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface LogroInfo {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
}

interface NuevoLogroModalProps {
  logros: LogroInfo[];
  onClose: () => void;
}

const iconMap: Record<string, ReactNode> = {
  fire: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
  ),
  star: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  trophy: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  ),
  medal: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  ),
  lightning: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  ),
  muscle: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zM2 10h2v4H2v-4zm18 0h2v4h-2v-4zM8 11h8v2H8v-2z" />
  ),
  crown: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l3 6 6-3-2 10H5L3 7l6 3 3-6z" />
  ),
  rocket: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  ),
  target: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  heart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
};

export default function NuevoLogroModal({ logros, onClose }: NuevoLogroModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const currentLogro = logros[currentIndex];
  const hasMore = currentIndex < logros.length - 1;

  useEffect(() => {
    // Trigger animation on mount
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (hasMore) {
      setIsAnimating(true);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 100);
    } else {
      onClose();
    }
  };

  const confettiDots = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      key: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${1 + Math.random()}s`,
    })),
  []);

  if (!currentLogro) return null;

  const iconPath = iconMap[currentLogro.icono] || iconMap.star;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl transform transition-all duration-500 ${
          isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Confetti effect background */}
        <div
          className="h-32 flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: currentLogro.color }}
        >
          <div className="absolute inset-0 opacity-20">
            {confettiDots.map((dot) => (
              <div
                key={dot.key}
                className="absolute w-2 h-2 rounded-full bg-white animate-bounce"
                style={{
                  left: dot.left,
                  top: dot.top,
                  animationDelay: dot.delay,
                  animationDuration: dot.duration,
                }}
              />
            ))}
          </div>
          <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-14 h-14 text-white drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {iconPath}
            </svg>
          </div>
        </div>

        <div className="p-6 text-center">
          <p className="text-sm font-medium text-green-600 mb-1">
            Nuevo logro desbloqueado
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentLogro.nombre}
          </h2>
          <p className="text-gray-600">{currentLogro.descripcion}</p>

          {logros.length > 1 && (
            <p className="text-sm text-gray-400 mt-4">
              {currentIndex + 1} de {logros.length}
            </p>
          )}

          <button
            onClick={handleNext}
            className="mt-6 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
          >
            {hasMore ? 'Siguiente' : 'Genial'}
          </button>
        </div>
      </div>
    </div>
  );
}
