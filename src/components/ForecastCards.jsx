import { weatherIconUrl } from '../utils/format'
import { dayName } from '../utils/format'

export default function ForecastCards({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
      <h2 className="text-sm uppercase tracking-wider text-gray-400">
        5-daagse verwachting
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {forecast.map((day) => (
          <div
            key={day.day}
            className="flex flex-col items-center rounded-xl border border-gray-800 bg-gray-950/60 p-4 text-center"
          >
            <div className="text-sm font-semibold text-gray-200">
              {dayName(day.day)}
            </div>
            <img
              src={weatherIconUrl(day)}
              alt={day.weatherdescription}
              title={day.weatherdescription}
              className="my-2 h-10 w-10"
            />
            <div className="font-semibold">
              <span className="text-white">{day.maxtemperature ?? day.maxtemp}</span>
              <span className="mx-1 text-gray-500">/</span>
              <span className="text-gray-400">{day.mintemperature ?? day.mintemp}</span>
              <span className="ml-0.5 text-xs text-gray-500">°C</span>
            </div>
            <div className="mt-2 flex gap-3 text-xs text-gray-400">
              <span title="Regenkans">☔ {day.rainChance}%</span>
              <span title="Zonkans">☀️ {day.sunChance}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}