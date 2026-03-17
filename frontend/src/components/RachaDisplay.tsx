interface RachaDisplayProps {
  rachaActual: number;
  rachaMaxima: number;
  activa: boolean;
  entrenamientosSemana: number;
  entrenamientosMes: number;
  entrenamientosTotal: number;
}

export default function RachaDisplay({
  rachaActual,
  rachaMaxima,
  activa,
  entrenamientosSemana,
  entrenamientosMes,
  entrenamientosTotal,
}: RachaDisplayProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
      {/* Racha principal */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-orange-100 text-sm font-medium">Tu racha</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">{rachaActual}</span>
            <span className="text-xl text-orange-100">
              {rachaActual === 1 ? 'dia' : 'dias'}
            </span>
          </div>
          {activa && rachaActual > 0 && (
            <div className="flex items-center gap-1 mt-1 text-orange-100">
              <svg
                className="w-4 h-4 animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span className="text-sm">Racha activa</span>
            </div>
          )}
        </div>
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>
          {rachaActual >= 7 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
              <svg
                className="w-4 h-4 text-yellow-900"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Mejor racha */}
      {rachaMaxima > rachaActual && (
        <div className="text-sm text-orange-100 mb-4">
          Tu mejor racha: <span className="font-bold text-white">{rachaMaxima} dias</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
        <div className="text-center">
          <p className="text-2xl font-bold">{entrenamientosSemana}</p>
          <p className="text-xs text-orange-100">esta semana</p>
        </div>
        <div className="text-center border-x border-white/20">
          <p className="text-2xl font-bold">{entrenamientosMes}</p>
          <p className="text-xs text-orange-100">este mes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{entrenamientosTotal}</p>
          <p className="text-xs text-orange-100">total</p>
        </div>
      </div>
    </div>
  );
}
