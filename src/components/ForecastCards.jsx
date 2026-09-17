import { weatherIconUrl, dayName } from '../utils/format'

export default function ForecastCards({ forecast }) {
  if (!forecast || forecast.length === 0) return null

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-4 lg:col-span-3">
      <h2 className="text-xs uppercase tracking-wider text-gray-400">
        5-daagse verwachting
      </h2>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {forecast.map((day) => (
          <div
            key={day.day}
            className="flex flex-col items-center rounded-xl border border-gray-800 bg-gray-950/60 px-2 py-3 text-center"
          >
            <div className="text-xs font-semibold text-gray-200">
              {dayName(day.day)}
            </div>
            <img
              src={weatherIconUrl(day)}
              alt={day.weatherdescription}
              title={day.weatherdescription}
              className="my-1.5 h-8 w-8"
            />
            <div className="text-sm font-semibold">
              <span className="text-white">{day.maxtemperature ?? day.maxtemp}</span>
              <span className="mx-0.5 text-gray-500">/</span>
              <span className="text-gray-400">{day.mintemperature ?? day.mintemp}</span>
              <span className="ml-0.5 text-[10px] text-gray-500">°C</span>
            </div>
            <div className="mt-1.5 flex gap-2 text-[10px] text-gray-400">
              <span title="Regenkans">☔ {day.rainChance}%</span>
              <span title="Zonkans">☀️ {day.sunChance}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
