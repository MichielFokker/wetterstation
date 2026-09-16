export function findNearestStation(stations, lat, lon) {
  let nearest = null
  let minDist = Infinity

  for (const station of stations) {
    if (!station.lat || !station.lon) continue
    const dist = haversine(lat, lon, station.lat, station.lon)
    if (dist < minDist) {
      minDist = dist
      nearest = station
    }
  }

  return nearest ? { station: nearest, distance: Math.round(minDist * 10) / 10 } : null
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}
