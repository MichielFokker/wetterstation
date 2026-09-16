import { useState, useEffect, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, ImageOverlay, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchRadarFrames, RADAR_BOUNDS } from '../utils/api'
import SynopOverlay from './SynopOverlay'

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const BUINRADAR_TILES = 'https://tiles.buienradar.nl/tiles-eu-v3/{z}/{x}/{y}.png'
const GREEN_MAX_ZOOM = 11
const REFRESH_MS = 5 * 60 * 1000
const FRAME_MS = 400
const IMAGE_LAYERS = ['radar', 'wolken', 'zon']
const SYNOP_LAYERS = ['isobar', 'wind']

function Recenter({ center }) {
  const map = useMap()
  useEffect(() => { map.panTo(center) }, [center, map])
  return null
}

function FitNetherlands() {
  const map = useMap()
  useEffect(() => {
    map.setView([52, 5.2], 7)
  }, [map])
  return null
}

function Resize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 50)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function MaxZoom({ zoom }) {
  const map = useMap()
  useEffect(() => {
    map.setMaxZoom(zoom)
    if (map.getZoom() > zoom) map.setZoom(zoom)
  }, [map, zoom])
  return null
}

const BASE_KEY = 'buienrader_base'

const PIN_ICON = L.divIcon({
  className: 'custom-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  html: '<div class="marker-pin"></div>',
})

function loadBase() {
  try {
    const v = localStorage.getItem(BASE_KEY)
    if (v === 'groen' || v === 'straat') return v
  } catch {}
  return 'straat'
}

export default function RadarMap({ center, locationName, onMapPick, stations = [] }) {
  const [base, setBase] = useState(loadBase)
  const [layer, setLayer] = useState('radar')
  const [radarData, setRadarData] = useState(null)
  const [index, setIndex] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const timerRef = useRef(null)
  const showLayer = layer !== 'kaart'
  const useFrames = IMAGE_LAYERS.includes(layer)

  const frames = radarData?.frames || []
  const current = frames[index] || null

  const pickBase = (b) => {
    setBase(b)
    try { localStorage.setItem(BASE_KEY, b) } catch {}
  }

  const preloadRef = useRef([])
  const preloadAll = useCallback((urls) => {
    preloadRef.current = urls.map((url) => {
      const attempt = (tries) => {
        const img = new Image()
        img.onload = () => {}
        img.onerror = () => {
          if (tries > 0) setTimeout(() => attempt(tries - 1), 1500)
        }
        img.src = url
        return img
      }
      return attempt(2)
    })
  }, [])

  const loadMeta = useCallback(() => {
    fetchRadarFrames(layer)
      .then((data) => {
        const start = Math.max(0, data.currentIndex >= 0 ? data.currentIndex : 0)
        setImageError(false)
        setRadarData(data)
        setIndex(start)
        setPlaying(true)
        preloadAll(data.frames.map((f) => f.url))
      })
      .catch(() => {})
  }, [layer, preloadAll])

  useEffect(() => {
    let cancelled = false
    if (useFrames) {
      setIndex(null)
      setRadarData(null)
      setPlaying(false)
      loadMeta()
      const id = setInterval(loadMeta, REFRESH_MS)
      return () => { cancelled = true; clearInterval(id) }
    }
    return () => { cancelled = true }
  }, [useFrames, loadMeta])

  useEffect(() => {
    if (playing && frames.length) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i === null ? 0 : (i + 1) % frames.length))
      }, FRAME_MS)
    }
    return () => clearInterval(timerRef.current)
  }, [playing, frames.length])

  const togglePlay = () => setPlaying((p) => !p)

  const handleScrub = (e) => {
    setPlaying(false)
    setIndex(Number(e.target.value))
  }

  const nowMs = radarData ? Date.parse(radarData.timestamp) : null

  const jumpTo = (h) => {
    if (!nowMs || !frames.length) return
    const target = nowMs + h * 60 * 60 * 1000
    let best = 0
    let bestDiff = Infinity
    frames.forEach((f, i) => {
      const diff = Math.abs(Date.parse(f.timestamp) - target)
      if (diff < bestDiff) {
        bestDiff = diff
        best = i
      }
    })
    setPlaying(false)
    setIndex(best)
  }

  const frameOffsetH = (frame) => {
    if (!frame || nowMs == null) return null
    const diff = (Date.parse(frame.timestamp) - nowMs) / (60 * 60 * 1000)
    return Number.isFinite(diff) ? Math.round(diff) : null
  }

  const presetLabel = (h) => {
    const f = frames.find((frame) => frameOffsetH(frame) === h)
    return f
      ? new Date(f.timestamp).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })
      : null
  }

  const firstTime = frames[0]
    ? new Date(frames[0].timestamp).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : ''
  const lastTime = frames.length
    ? new Date(frames[frames.length - 1].timestamp).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : ''

  const buttonClass = (active) =>
    `pointer-events-auto rounded-lg border px-3 py-1.5 text-xs font-semibold shadow transition-colors ${
      active
        ? 'border-sky-600 bg-sky-600 text-white'
        : 'border-gray-700 bg-gray-900/90 text-gray-300 hover:bg-gray-800'
    }`

  const timeLabel = current
    ? new Date(current.timestamp).toLocaleString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setLayer('radar')} className={buttonClass(layer === 'radar')}>
            ⚡ Radar
          </button>
          <button onClick={() => setLayer('wolken')} className={buttonClass(layer === 'wolken')}>
            ☁️ Wolken
          </button>
          <button onClick={() => setLayer('zon')} className={buttonClass(layer === 'zon')}>
            ☀️ Zon
          </button>
          <button onClick={() => setLayer('isobar')} className={buttonClass(layer === 'isobar')}>
            〰️ Isobaren
          </button>
          <button onClick={() => setLayer('wind')} className={buttonClass(layer === 'wind')}>
            💨 Wind
          </button>
          <button onClick={() => setLayer('kaart')} className={buttonClass(layer === 'kaart')}>
            🧭 Geen laag
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => pickBase('groen')} className={buttonClass(base === 'groen')}>
            🗺️ Groen
          </button>
          <button onClick={() => pickBase('straat')} className={buttonClass(base === 'straat')}>
            🧭 Straat
          </button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
      <MapContainer
        center={center}
        zoom={7}
        minZoom={4}
        maxZoom={base === 'groen' ? GREEN_MAX_ZOOM : 19}
        className="h-full w-full"
        zoomControl={true}
      >
        <FitNetherlands />
        <Resize />
        <MaxZoom zoom={base === 'groen' ? GREEN_MAX_ZOOM : 19} />
        <TileLayer
          url={base === 'groen' ? BUINRADAR_TILES : OSM_TILE}
          attribution={base === 'groen' ? '&copy; Buienradar.nl' : '&copy; OpenStreetMap contributors'}
          maxZoom={base === 'groen' ? GREEN_MAX_ZOOM : 19}
        />
        {showLayer && useFrames && current && (
          <ImageOverlay
            url={current.url}
            bounds={RADAR_BOUNDS}
            opacity={layer === 'zon' ? 0.5 : layer === 'wolken' ? 0.8 : 0.95}
            zIndex={400}
            className={layer === 'zon' ? 'sun-overlay' : 'radar-overlay'}
            eventHandlers={{
              load: () => setImageError(false),
              error: () => setImageError(true),
            }}
          />
        )}
        {showLayer && SYNOP_LAYERS.includes(layer) && (
          <SynopOverlay mode={layer === 'isobar' ? 'isobar' : 'wind'} stations={stations} />
        )}
        <Recenter center={center} />
        <Marker
          position={center}
          draggable
          icon={PIN_ICON}
          eventHandlers={{
            dragend: (e) => {
              const { lat, lng } = e.target.getLatLng()
              onMapPick?.(lat, lng)
            },
          }}
        >
          <Popup>{locationName || 'Jouw locatie'}</Popup>
        </Marker>
      </MapContainer>

      {useFrames && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] flex justify-center p-3">
          <div className="pointer-events-auto w-full max-w-md rounded-lg border border-gray-800 bg-gray-900/90 px-3 py-2 text-xs text-gray-300 shadow">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                disabled={!frames.length}
                className="rounded border border-gray-700 bg-gray-800 px-2.5 py-1 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-40"
              >
                {playing ? '⏸' : '▶'}
              </button>
              <span className="font-semibold text-white">{timeLabel || '…'}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  current?.forecast ? 'bg-sky-900 text-sky-200' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {current && frameOffsetH(current) > 0
                  ? `vooruit +${frameOffsetH(current)} u`
                  : current && frameOffsetH(current) < 0
                    ? `verleden ${frameOffsetH(current)} u`
                    : layer}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {[-1, 0, 1, 2, 3].map((h) => (
                <button
                  key={h}
                  onClick={() => jumpTo(h)}
                  className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${
                    frameOffsetH(current) === h
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {h === 0 ? 'Nu' : h < 0 ? `${h}u` : `+${h}u`}
                  {presetLabel(h) && (
                    <span className="ml-1 font-normal opacity-70">{presetLabel(h)}</span>
                  )}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={index ?? 0}
              onChange={handleScrub}
              disabled={!frames.length}
              className="mt-1.5 w-full accent-sky-500"
            />
            <div className="mt-0.5 flex justify-between text-[10px] text-gray-500">
              <span>
                {frames[0]
                  ? `${firstTime} · ${frameOffsetH(frames[0]) < 0 ? `−${Math.abs(frameOffsetH(frames[0]))} u` : 'nu'}`
                  : '—'}
              </span>
              <span>
                {lastTime
                  ? `${lastTime} · +${frameOffsetH(frames[frames.length - 1])} u`
                  : '—'}
              </span>
            </div>
            {imageError && current && (
              <p className="mt-1.5 rounded bg-amber-950/60 px-2 py-1 text-center text-[10px] text-amber-300">
                ⚠ Beeld voor {timeLabel} nog niet beschikbaar bij Buienradar — het toont nog het
                vorige geladen beeld.
              </p>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}