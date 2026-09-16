const WMO = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  56: '🌦️', 57: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌧️', 81: '🌧️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function dayName(isoDate) {
  const date = new Date(isoDate + 'T00:00:00')
  return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Forecast14Day({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="text-sm uppercase tracking-wider text-gray-400">14-daagse verwachting</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {forecast.map((day) => (
          <div
            key={day.day}
            className="flex flex-col items-center rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-center"
          >
            <div className="text-xs font-semibold text-gray-200">{dayName(day.day)}</div>
            <div className="my-1 text-2xl" title={`Weercode ${day.weathercode ?? '?'}`}>
              {WMO[day.weathercode] ?? '🌡️'}
            </div>
            <div className="font-semibold">
              <span className="text-white">{day.maxtemperature ?? '--'}</span>
              <span className="mx-1 text-gray-500">/</span>
              <span className="text-gray-400">{day.mintemperature ?? '--'}</span>
              <span className="ml-0.5 text-xs text-gray-500">°C</span>
            </div>
            <div className="mt-1 text-xs text-gray-400">
              🌧️ {day.rainChance ?? '--'}%
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Bron: Open-Meteo (weermodel). Per dag weergegeven.
      </p>
    </div>
  )
}