const API_BASE = 'https://data.buienradar.nl/2.0/feed/json'
const RAIN_API = 'https://gpsgadget.buienradar.nl/data/raintext'
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

const RADAR_TYPES = {
  radar: 'RadarMapRain5mNL',
  wolken: 'RadarMapCloud5mNL',
  zon: 'RadarMapSun5mNL',
  europa: 'RadarMapRain5mEU',
}

export const RADAR_BOUNDS = [
  [54.8, 0],
  [49.5, 10],
]

export const EU_RADAR_BOUNDS = [
  [61, -13.5],
  [34, 35],
]

export async function fetchRadarFrames(type = 'radar') {
  const metaType = RADAR_TYPES[type] || RADAR_TYPES.radar
  const res = await fetch(
    `https://image-lite.buienradar.nl/3.0/metadata/${metaType}?history=12&forecast=36`
  )
  if (!res.ok) throw new Error(`kaartmetadata niet beschikbaar (${metaType})`)
  const meta = await res.json()
  const now = Date.parse(toUtcIso(meta.timestamp))
  return {
    width: meta.width,
    height: meta.height,
    timestamp: toUtcIso(meta.timestamp),
    currentIndex: meta.times.findIndex((t) => Date.parse(toUtcIso(t.timestamp)) >= now),
    frames: meta.times.map((t) => ({
      url: t.url,
      timestamp: toUtcIso(t.timestamp),
      forecast: Date.parse(toUtcIso(t.timestamp)) > now,
    })),
  }
}

function toUtcIso(ts) {
  if (typeof ts !== 'string' || !ts) return ts
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(ts)) return new Date(ts).toISOString()
  return new Date(ts + 'Z').toISOString()
}

export async function fetchWeatherData() {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('Failed to fetch weather data')
  return res.json()
}

export async function fetchEuPressureGrid() {
  const lats = []
  const lons = []
  const step = 2
  for (let la = 33; la <= 71; la += step) {
    for (let lo = -14; lo <= 36; lo += step) {
      lats.push(la.toFixed(1))
      lons.push(lo.toFixed(1))
    }
  }
  const params = new URLSearchParams({
    latitude: lats.join(','),
    longitude: lons.join(','),
    hourly: 'pressure_msl',
    forecast_hours: '1',
    timezone: 'UTC',
  })
  const res = await fetch(`${OPEN_METEO}?${params}`)
  if (!res.ok) throw new Error('Failed to fetch European pressure grid')
  const list = await res.json()
  return (list || [])
    .filter((p) => p?.hourly?.pressure_msl?.[0] != null)
    .map((p) => ({
      lat: p.latitude,
      lon: p.longitude,
      airpressure: p.hourly.pressure_msl[0],
    }))
}

export async function fetch14DayForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunshine_duration',
    forecast_days: '14',
    timezone: 'Europe/Amsterdam',
  })
  const res = await fetch(`${OPEN_METEO}?${params}`)
  if (!res.ok) throw new Error('Failed to fetch 14-day forecast')
  const data = await res.json()
  const d = data.daily || {}
  const codes = typeof d.weather_code === 'string' ? d.weather_code : d.weather_code
  return (d.time || []).map((day, i) => ({
    day,
    weathercode: codes?.[i],
    maxtemperature: round1(d.temperature_2m_max?.[i]),
    mintemperature: round1(d.temperature_2m_min?.[i]),
    rainChance: d.precipitation_probability_max?.[i],
    sunshineSeconds: d.sunshine_duration?.[i],
  }))
}

export async function fetchHourlyForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    hourly: 'temperature_2m,precipitation,precipitation_probability,weather_code',
    past_days: '1',
    forecast_days: '2',
    timezone: 'Europe/Amsterdam',
  })
  const res = await fetch(`${OPEN_METEO}?${params}`)
  if (!res.ok) throw new Error('Failed to fetch hourly forecast')
  const data = await res.json()
  const h = data.hourly || {}
  return (h.time || []).map((t, i) => ({
    time: t,
    temperature: h.temperature_2m?.[i] == null ? null : Math.round(h.temperature_2m[i]),
    precipitation: h.precipitation?.[i] == null ? 0 : Math.round(h.precipitation[i] * 100) / 100,
    probability: h.precipitation_probability?.[i] ?? null,
    weathercode: h.weather_code?.[i] ?? null,
  }))
}

function round1(v) {
  return v == null ? null : Math.round(v * 10) / 10
}

export async function fetchRainForecast(lat, lon) {
  const url = `${RAIN_API}?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch rain forecast')
  const text = await res.text()
  return parseRainText(text)
}

function parseRainText(text) {
  const lines = text.trim().split('\n')
  return lines.map(line => {
    const [valueStr, timeStr] = line.trim().split('|')
    const value = parseInt(valueStr, 10) || 0
    const intensity = Math.pow(10, (value - 109) / 32)
    return {
      time: timeStr,
      value,
      intensity: Math.round(intensity * 100) / 100,
    }
  })
}
