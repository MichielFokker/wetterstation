import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

function interpolate(v0, v1, level) {
  if (v0 === v1) return 0.5
  return (level - v0) / (v1 - v0)
}

const CONTOUR_PAIRS = {
  0: null,
  1: [3, 0],
  2: [0, 1],
  3: [3, 1],
  4: [3, 2],
  5: [0, 2],
  6: [3, 1],
  7: [2, 1],
  8: [2, 1],
  9: [0, 2],
  10: [1, 2],
  11: [0, 2],
  12: [0, 2],
  13: [1, 0],
  14: [2, 3],
  15: null,
}

function edgePoint(corners, edge, level) {
  const [A, B] =
    edge === 0 ? [corners.c0, corners.c1]
      : edge === 1 ? [corners.c1, corners.c3]
        : edge === 2 ? [corners.c3, corners.c2]
          : [corners.c0, corners.c2]
  const t = interpolate(A.v, B.v, level)
  return { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) }
}

export default function SynopOverlay({ mode, stations }) {
  const map = useMap()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const hasIso = mode === 'isobar'
    const pressureStations = stations.filter((s) => typeof s.airpressure === 'number')
    const windStations = stations.filter((s) => typeof s.winddirectiondegrees === 'number')

    const draw = () => {
      const size = map.getSize()
      if (!size.x || !size.y) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = size.x * dpr
      canvas.height = size.y * dpr
      canvas.style.width = `${size.x}px`
      canvas.style.height = `${size.y}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size.x, size.y)

      if (hasIso) {
        if (pressureStations.length < 3) return
        const b = map.getBounds()
        const allPressure = pressureStations.map((s) => s.airpressure)
        const min = Math.min(...allPressure)
        const max = Math.max(...allPressure)
        const step = max - min > 14 ? 4 : 2

        const colsRaw = Math.round(size.x / 14)
        const rowsRaw = Math.round(size.y / 14)
        const cellsBudget = 4_000_000 / pressureStations.length
        const capped = Math.max(40, Math.round(Math.sqrt(cellsBudget)))
        const cols = clamp(colsRaw, 40, Math.min(320, capped))
        const rows = clamp(rowsRaw, 40, Math.min(320, capped))

        const sw = b.getWest()
        const ne = b.getNorth()
        const spanLon = b.getEast() - sw
        const spanLat = ne - b.getSouth()

        const R = 6
        const valueAt = (lat, lon) => {
          let best = null
          let bestD = Infinity
          let wsum = 0
          let vsum = 0
          for (const s of pressureStations) {
            const dLat = s.lat - lat
            const dLon = s.lon - lon
            const d2 = dLat * dLat + dLon * dLon
            if (d2 < bestD) {
              bestD = d2
              best = s
            }
            if (d2 < R * R) {
              const w = (R * R - d2) / (R * R + d2)
              const w2 = w * w
              wsum += w2
              vsum += s.airpressure * w2
            }
          }
          if (wsum > 0) return vsum / wsum
          return best ? best.airpressure : null
        }

        for (let level = Math.ceil(min / step) * step; level < max; level += step) {
          ctx.strokeStyle = 'rgba(220, 235, 255, 0.55)'
          ctx.lineWidth = 1.4
          ctx.beginPath()
          let labelCount = 0
          for (let i = 0; i < rows - 1; i++) {
            for (let j = 0; j < cols - 1; j++) {
              const lat0 = ne - (spanLat * i) / (rows - 1)
              const lat1 = ne - (spanLat * (i + 1)) / (rows - 1)
              const lon0 = sw + (spanLon * j) / (cols - 1)
              const lon1 = sw + (spanLon * (j + 1)) / (cols - 1)

              const c0 = { x: lon0, y: lat0, v: valueAt(lat0, lon0) }
              const c1 = { x: lon1, y: lat0, v: valueAt(lat0, lon1) }
              const c2 = { x: lon0, y: lat1, v: valueAt(lat1, lon0) }
              const c3 = { x: lon1, y: lat1, v: valueAt(lat1, lon1) }
              if ([c0, c1, c2, c3].some((c) => c.v == null)) continue

              const mask =
                (c0.v > level ? 1 : 0) |
                (c1.v > level ? 2 : 0) |
                (c2.v > level ? 4 : 0) |
                (c3.v > level ? 8 : 0)
              const pair = CONTOUR_PAIRS[mask]
              if (!pair) continue

              const corners = { c0, c1, c2, c3 }
              const p0 = edgePoint(corners, pair[0], level)
              const p1 = edgePoint(corners, pair[1], level)

              const a = map.latLngToContainerPoint([p0.y, p0.x])
              const bpt = map.latLngToContainerPoint([p1.y, p1.x])
              ctx.moveTo(a.x, a.y)
              ctx.lineTo(bpt.x, bpt.y)

              labelCount++
              if (labelCount % 60 === 0) {
                const mid = map.latLngToContainerPoint([(p0.y + p1.y) / 2, (p0.x + p1.x) / 2])
                ctx.fillStyle = 'rgba(230, 240, 255, 0.9)'
                ctx.font = '10px system-ui, sans-serif'
                ctx.fillText(String(level), mid.x + 3, mid.y + 3)
              }
            }
          }
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(230, 240, 255, 0.95)'
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillText('Isobaren (luchtdruk in hPa)', 8, size.y - 14)
      } else {
        if (windStations.length === 0) return
        for (const s of windStations) {
          const p = map.latLngToContainerPoint([s.lat, s.lon])
          const deg = (s.winddirectiondegrees + 180) % 360
          const rad = (deg * Math.PI) / 180
          const len = 12 + Math.min((s.windspeedBft || 2) * 2.4, 30)
          const dx = Math.cos(rad) * len
          const dy = Math.sin(rad) * len

          ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + dx, p.y + dy)
          ctx.stroke()

          const head = 5
          const a1 = rad + Math.PI - 0.4
          const a2 = rad + Math.PI + 0.4
          ctx.beginPath()
          ctx.moveTo(p.x + dx, p.y + dy)
          ctx.lineTo(p.x + dx + Math.cos(a1) * head, p.y + dy + Math.sin(a1) * head)
          ctx.moveTo(p.x + dx, p.y + dy)
          ctx.lineTo(p.x + dx + Math.cos(a2) * head, p.y + dy + Math.sin(a2) * head)
          ctx.stroke()

          ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
          ctx.beginPath()
          ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.fillStyle = 'rgba(34, 211, 238, 0.95)'
        ctx.font = '11px system-ui, sans-serif'
        ctx.fillText('Windrichting per KNMI-station (pijl = heenwaarts)', 8, size.y - 14)
      }
    }

    draw()
    map.on('moveend zoomend resize', draw)
    const t = setTimeout(draw, 100)
    return () => {
      map.off('moveend zoomend resize', draw)
      clearTimeout(t)
    }
  }, [map, mode, stations])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 500 }}
    />
  )
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}