import { useState } from 'react'

const INITIAL_SUGGESTIONS = [
  { name: 'De Bilt', lat: 52.1, lon: 5.18 },
  { name: 'Amsterdam', lat: 52.37, lon: 4.9 },
  { name: 'Rotterdam', lat: 51.92, lon: 4.48 },
  { name: 'Utrecht', lat: 52.09, lon: 5.12 },
  { name: 'Groningen', lat: 53.22, lon: 6.56 },
  { name: 'Eindhoven', lat: 51.44, lon: 5.48 },
  { name: 'Maastricht', lat: 50.85, lon: 5.69 },
  { name: 'Nijmegen', lat: 51.842, lon: 5.852 },
]

export default function LocationSearch({ name, onSelect, onCurrentLocation }) {
  const [value, setValue] = useState(name || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = value.trim()
    if (!query) return

    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=nl&limit=5`)
      .then((r) => r.json())
      .then((results) => {
        if (results.length > 0) {
          const first = results[0]
          onSelect(parseFloat(first.lat), parseFloat(first.lon), first.display_name)
          setValue('')
        }
      })
      .catch(() => {})
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Zoek een plaats in Nederland…"
          className="flex-1 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          💾 Opslaan
        </button>
        {onCurrentLocation && (
          <button
            type="button"
            onClick={onCurrentLocation}
            className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-2.5 text-sm text-gray-300 transition-colors hover:bg-gray-800"
            title="Gebruik mijn locatie"
          >
            📍
          </button>
        )}
      </form>
      <div className="mt-2 flex flex-wrap gap-2">
        {INITIAL_SUGGESTIONS.map((s) => (
          <button
            key={s.name}
            onClick={() => onSelect(s.lat, s.lon, s.name)}
            className="rounded-lg border border-gray-800 bg-gray-900/40 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-sky-600 hover:text-gray-200"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}