import { useState } from 'react'

const MODES = [
  { key: 'back3', label: '← 3u', hours: -3 },
  { key: 'fwd3', label: '3u', hours: 3 },
  { key: 'fwd8', label: '8u', hours: 8 },
  { key: 'fwd24', label: '24u', hours: 24 },
]

function timeLabel(iso) {
  const d = new Date(iso)
  const label = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
  return `${label} ${d.toLocaleDateString('nl-NL', { weekday: 'short' })}`
}

function barColor(mm, past) {
  if (past) return mm > 0 ? 'bg-teal-600/70' : 'bg-gray-800/60'
  if (mm >= 5) return 'bg-red-500/80'
  if (mm >= 2) return 'bg-amber-500/80'
  if (mm >= 0.5) return 'bg-sky-500/80'
  if (mm > 0) return 'bg-sky-600/70'
  return 'bg-gray-700/40'
}

export default function HourlyForecast({ forecast }) {
  const [mode, setMode] = useState('back3')
  const [open, setOpen] = useState(false)
  const [nowMs] = useState(() => Date.now())
  if (!forecast || forecast.length === 0) return null

  const mod = MODES.find((m) => m.key === mode) || MODES[0]
  let base = forecast.findIndex((p) => Date.parse(p.time) >= nowMs)
  if (base === -1) base = forecast.length

  const past = mod.hours < 0
  const startIdx = past ? Math.max(0, base + mod.hours) : base
  const slice = forecast.slice(startIdx, past ? base : startIdx + mod.hours)
  const maxRain = Math.max(...slice.map((p) => p.precipitation || 0), 0.1)
  const height = 110

  const buttonClass = (active) =>
    `rounded border px-2.5 py-1 text-xs font-semibold transition-colors ${
      active
        ? 'border-sky-600 bg-sky-600 text-white'
        : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
    }`

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2"
      >
        <h2 className="text-sm uppercase tracking-wider text-gray-400">
          Neerslag <span className="normal-case">· {past ? 'verleden' : 'vooruit'}</span>
        </h2>
        <span
          className={`text-gray-500 transition-transform ${open ? '' : '-rotate-90'}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {open && (
        <>
          <div className="mt-3 flex gap-1">
            {MODES.map((m) => (
              <button key={m.key} onClick={() => setMode(m.key)} className={buttonClass(mode === m.key)}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="relative mt-4">
        <div className="flex items-end gap-0.5" style={{ height }}>
          {slice.map((p) => {
            const h = Math.max(Math.min((p.precipitation / maxRain) * height, height), 2)
            return (
              <div key={p.time} className="flex-1">
                <div
                  className={`w-full rounded-t-sm transition-all ${barColor(p.precipitation, past)}`}
                  style={{ height: h }}
                  title={`${timeLabel(p.time)}: ${p.precipitation.toFixed(2)} mm, kans ${p.probability ?? '--'}%`}
                />
              </div>
            )
          })}
        </div>

        <div className="relative mt-1 flex" style={{ height: 30 }}>
          <div className="absolute inset-x-0 top-0 border-t border-gray-700/50" />
          {slice.map((p, i) =>
            (mode !== 'fwd24' || i % 4 === 0) ? (
              <div key={p.time} className="relative flex-1 overflow-visible">
                <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center">
                  <div className="h-2 border-l border-gray-500/60" />
                  <span className="mt-0.5 whitespace-nowrap text-[10px] text-gray-400">
                    {new Date(p.time).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] text-sky-300">
                    {p.probability != null ? `${p.probability}%` : ''}
                  </span>
                </div>
              </div>
            ) : null
          )}
        </div>

        {!past && (
          <span className="absolute -left-1 top-0 rounded bg-sky-900 px-1 text-[10px] text-sky-200">
            Nu ↓
          </span>
        )}
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Bron: Open-Meteo (weermodel). ← = afgelopen uren (modelanalyse), → = verwachting per uur.
            Balk = neerslag in mm/u, getal = neerslagkans.
          </p>
        </>
      )}
    </div>
  )
}