export function weatherIconUrl(item) {
  return item?.fullIconUrl || item?.iconurl || null
}

export function windDirectionText(dir) {
  if (!dir) return '--'
  const dirMap = {
    N: 'N', NO: 'NO', O: 'O', ZO: 'ZO',
    Z: 'Z', ZW: 'ZW', W: 'W', NW: 'NW',
  }
  return dirMap[dir.toUpperCase()] || dir
}

export function dayName(isoDate) {
  const date = new Date(isoDate)
  return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatRainIntensity(mm) {
  if (mm < 0.01) return 'Droog'
  if (mm < 0.5) return 'Lichte regen'
  if (mm < 2) return 'Matige regen'
  if (mm < 5) return 'Flinke regen'
  return 'Heftige regen'
}