import { formatRainIntensity } from '../utils/format'

export default function RainGraph({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  const rawMax = Math.max(...forecast.map((p) => p.intensity), 1)
  const max = Math.min(rawMax, 5)
  const height = 120
  const total = forecast.length

  const toMin = (t) => {
    const [h, m] = String(t || '').split(':').map(Number)
    if (Number.isNaN(h) || Number.isNaN(m)) return null
    return h * 60 + m
  }

  const ticks = []
  const TICK_EVERY = 20 // minutes
  forecast.forEach((point, i) => {
    const barMin = toMin(point.time)
    if (barMin === null) return
    const isStart = i === 0
    const isEnd = i === total - 1
    const onTick = barMin % TICK_EVERY === 0
    if (isStart || isEnd || onTick) {
      ticks.push({ index: i, label: isStart ? 'Nu' : point.time })
    }
  })
  if (ticks.length < 2 && forecast.length > 0) {
    ticks.length = 0
    ticks.push({ index: 0, label: 'Nu' })
    ticks.push({ index: total - 1, label: forecast[total - 1]?.time || '' })
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="text-sm uppercase tracking-wider text-gray-400">
        Buienverwachting komende 2 uur
      </h2>
      <div className="mt-4 flex items-end gap-0.5" style={{ height }}>
        {forecast.map((point, i) => {
          const h = Math.max(Math.min((point.intensity / max) * height, height), 2)
          const wet = point.intensity >= 0.01
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm transition-all ${
                wet ? 'bg-sky-500/80 hover:bg-sky-400' : 'bg-gray-700/40'
              }`}
              style={{ height: h }}
              title={`${point.time}: ${point.intensity.toFixed(2)} mm/u (${formatRainIntensity(point.intensity)})`}
            />
          )
        })}
      </div>

      <div className="relative mt-1 flex" style={{ height: 18 }}>
        <div className="absolute inset-x-0 top-0 border-t border-gray-700/50" />
        {ticks.map((tick) => (
          <div
            key={tick.index}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${(tick.index / total) * 100}%` }}
          >
            <div className="h-2 border-l border-gray-500/60" />
            <span className="mt-0.5 text-[10px] text-gray-400 whitespace-nowrap" style={{ transform: 'translateX(-50%)' }}>
              {tick.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Bron: Buienradar GPS-systeem. Per 5 minuten, intensiteit in mm/u.
      </p>
    </div>
  )
}