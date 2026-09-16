import { useState, useEffect, useCallback } from 'react'
import { fetchWeatherData, fetchRainForecast, fetch14DayForecast, fetchHourlyForecast } from '../utils/api'
import { findNearestStation } from '../utils/nearestStation'

const DEFAULT_CENTER = [52.09, 5.12] // De Bilt
const STORAGE_KEY = 'buienrader_location'

function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length === 2) {
      return { lat: parsed[0], lon: parsed[1], name: '' }
    }
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
      return {
        lat: parsed.lat,
        lon: parsed.lon,
        name: typeof parsed.name === 'string' ? parsed.name : '',
      }
    }
  } catch {}
  return null
}

export function useWeatherData() {
  const [data, setData] = useState(null)
  const [rainForecast, setRainForecast] = useState([])
  const [forecast14, setForecast14] = useState([])
  const [hourlyForecast, setHourlyForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savedLoc] = useState(loadSavedLocation)
  const [center, setCenter] = useState(() => (savedLoc ? [savedLoc.lat, savedLoc.lon] : DEFAULT_CENTER))
  const [locationName, setLocationName] = useState(savedLoc ? savedLoc.name : '')

  const load = useCallback(async (lat, lon) => {
    try {
      setLoading(true)
      setError(null)

      const weatherData = await fetchWeatherData()
      const stations = weatherData.actual?.stationmeasurements || []
      const nearest = findNearestStation(stations, lat, lon)

      const [rain, f14, hourly] = await Promise.all([
        fetchRainForecast(lat, lon),
        fetch14DayForecast(lat, lon),
        fetchHourlyForecast(lat, lon),
      ])

      setData({ weather: weatherData, nearest })
      setRainForecast(rain)
      setForecast14(f14)
      setHourlyForecast(hourly)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(center[0], center[1])
  }, [])

  const updateLocation = useCallback((lat, lon, name = '') => {
    const newCenter = [lat, lon]
    const newName = name || ''
    setCenter(newCenter)
    setLocationName(newName)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lon, name: newName })) } catch {}
    load(lat, lon)
  }, [load])

  return {
    data,
    rainForecast,
    forecast14,
    hourlyForecast,
    loading,
    error,
    center,
    locationName,
    updateLocation,
  }
}
