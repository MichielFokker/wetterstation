import { useState } from 'react'
import { useWeatherData } from './hooks/useWeatherData'
import RadarMap from './components/RadarMap'
import CurrentWeather from './components/CurrentWeather'
import ForecastCards from './components/ForecastCards'
import Forecast14Day from './components/Forecast14Day'
import RainGraph from './components/RainGraph'
import HourlyForecast from './components/HourlyForecast'
import LocationSearch from './components/LocationSearch'

export default function App() {
  const { data, rainForecast, forecast14, hourlyForecast, loading, error, center, locationName, updateLocation } = useWeatherData()
  const [status, setStatus] = useState(locationName ? `📍 ${locationName}` : '')

  const handleSelect = (lat, lon, name) => {
    updateLocation(lat, lon, name)
    setStatus(name ? `📍 ${name}` : '')
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocatie niet ondersteund in deze browser')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude)
        setStatus('📍 Jouw locatie')
      },
      () => setStatus('Locatie niet beschikbaar')
    )
  }

  const handleMapPick = (lat, lon) => {
    updateLocation(lat, lon)
    setStatus(`📍 ${lat.toFixed(3)}, ${lon.toFixed(3)}`)
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&format=json&accept-language=nl`
    )
      .then((r) => r.json())
      .then((d) => {
        const short = d?.display_name?.split(',')[0]
        if (short) {
          updateLocation(lat, lon, short)
          setStatus(`📍 ${short}`)
        }
      })
      .catch(() => {})
  }

  const stations = data?.weather?.actual?.stationmeasurements || []
  const station = data?.nearest?.station
  const forecast = data?.weather?.forecast?.fivedayforecast || []
  const weatherreport = data?.weather?.forecast?.weatherreport
  const wetStations = stations.filter((s) => (s.precipitation ?? 0) > 0.05).length
  const mapLocationName =
    locationName || data?.nearest?.station?.regio || station?.stationname || 'Nederland'

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            ⛅ Wetterstation <span className="ml-2 align-baseline rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white">v3.2</span>
          </h1>
          <p className="text-sm text-gray-400">Actuele neerslagradar voor Nederland</p>
        </div>
        <span className="rounded-full border border-gray-800 bg-gray-900/60 px-3 py-1 text-xs text-gray-400">
          Ook geopend: {status || 'De Bilt'}
        </span>
      </header>

      <LocationSearch name={locationName} onSelect={handleSelect} onCurrentLocation={handleCurrentLocation} />

      {error && (
        <div className="mb-6 rounded-xl border border-red-900 bg-red-950/60 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex items-center justify-center py-32 text-gray-500">
          <span className="animate-spin">⏳</span>
          <span className="ml-2">Weergegevens laden…</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="h-[520px] overflow-hidden">
              <RadarMap center={center} locationName={mapLocationName} onMapPick={handleMapPick} stations={stations} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              De radarbeelden worden elke 5 minuten ververst. Sleep om te pannen, scroll om te zoomen. ·{' '}
              <span className={wetStations > 0 ? 'text-sky-400' : 'text-gray-400'}>
                {wetStations === 0
                  ? 'Momenteel geen neerslag gemeten bij KNMI-stations'
                  : `${wetStations} van ${stations.length} KNMI-stations meten nu neerslag`}
              </span>
            </p>
          </div>

          <div className="space-y-6">
            <CurrentWeather station={station} />
            <RainGraph forecast={rainForecast} />
            <HourlyForecast forecast={hourlyForecast} />
          </div>

          <div className="lg:col-span-3">
            <ForecastCards forecast={forecast} />
          </div>

          <div className="lg:col-span-3">
            <Forecast14Day forecast={forecast14} />
          </div>

          {weatherreport && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 lg:col-span-3">
              <h2 className="text-sm uppercase tracking-wider text-gray-400">Weerbericht</h2>
              <h3 className="mt-2 text-lg font-semibold text-white">{weatherreport.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">{weatherreport.summary}</p>
              <p className="mt-1 text-xs text-gray-500">
                {weatherreport.author} · {new Date(weatherreport.published).toLocaleString('nl-NL')}
              </p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-8 border-t border-gray-800 pt-4 text-xs leading-relaxed text-gray-500">
        <p>
          Weergegevens: &copy; Buienradar.nl / RTL Nederland. Data vrij gebruikt onder voorwaarde
          van bronvermelding. Kaartlaag: &copy; OpenStreetMap contributors.
        </p>
        <p className="mt-1">
          Dit is een persoonlijk oefenproject. Bekijk het origineel op{' '}
          <a className="text-sky-400 hover:underline" href="https://www.buienradar.nl" target="_blank" rel="noreferrer">
            buienradar.nl
          </a>
          .
        </p>
      </footer>
    </div>
  )
}