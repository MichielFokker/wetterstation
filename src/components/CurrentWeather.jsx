import { weatherIconUrl, windDirectionText } from '../utils/format'

function Stat({ label, value, unit, icon }) {
  return (
    <div className="flex h-full items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-lg font-semibold leading-tight">
          <span className="whitespace-nowrap">{value}</span>
          {unit && <span className="ml-0.5 whitespace-nowrap text-sm text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

export default function CurrentWeather({ station }) {
  if (!station) return null

  const {
    regio,
    stationname,
    timestamp,
    weatherdescription,
    temperature,
    feeltemperature,
    airpressure,
    humidity,
    windspeed,
    winddirection,
  } = station

  const feel = feeltemperature ?? temperature

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-wider text-gray-400">{regio || stationname}</h2>
          <div className="mt-2 flex items-center gap-3">
            <img
              src={weatherIconUrl(station)}
              alt={weatherdescription}
              className="h-14 w-14"
            />
            <span className="text-5xl font-bold text-white">{temperature ?? '--'}</span>
            <span className="text-2xl text-gray-400">°C</span>
          </div>
          <p className="mt-1 text-gray-300">{weatherdescription}</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          {timestamp && <p>Gemeten: {new Date(timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 items-stretch gap-3">
        <Stat icon="🌡️" label="Gevoel" value={feel !== undefined ? Math.round(feel) : '--'} unit="°C" />
        <Stat
          icon="💨"
          label="Wind"
          value={windDirectionText(winddirection)}
          unit={windspeed !== undefined ? `${windspeed} m/s` : ''}
        />
        <Stat icon="💧" label="Vocht" value={humidity !== undefined ? Math.round(humidity) : '--'} unit="%" />
        <Stat icon="⏲️" label="Druk" value={airpressure !== undefined ? Math.round(airpressure) : '--'} unit="hPa" />
      </div>
    </div>
  )
}