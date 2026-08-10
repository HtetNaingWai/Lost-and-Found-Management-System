import { useCallback, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon'

const MANDALAY_CENTER = [21.9588, 96.0891]
const DEFAULT_ZOOM = 12

async function reverseGeocode(latitude, longitude) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
    { headers: { Accept: 'application/json' } },
  )

  if (!response.ok) return ''

  const payload = await response.json()
  return payload.display_name ?? ''
}

async function searchLocation(query) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=mm&q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } },
  )

  if (!response.ok) return null

  const [result] = await response.json()

  if (!result?.lat || !result?.lon) return null

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    address: result.display_name ?? query,
  }
}

function LocationPicker({ value, onChange }) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const selectPointRef = useRef(null)
  const initialCoordinatesRef = useRef(
    value?.latitude && value?.longitude
      ? [Number(value.latitude), Number(value.longitude)]
      : null,
  )
  const [query, setQuery] = useState(value?.location ?? '')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const setMarker = useCallback((latitude, longitude) => {
    const map = mapRef.current
    if (!map) return

    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const next = markerRef.current?.getLatLng()
        if (next) {
          void selectPointRef.current?.(next.lat, next.lng, { reverse: true, fly: false })
        }
      })
      return
    }

    markerRef.current.setLatLng([latitude, longitude])
  }, [])

  const selectPoint = useCallback(async (
    latitude,
    longitude,
    { reverse = false, fly = true, address = '' } = {},
  ) => {
    const roundedLatitude = Number(latitude.toFixed(7))
    const roundedLongitude = Number(longitude.toFixed(7))
    let nextAddress = address

    setStatus(reverse ? 'Finding address for selected point...' : '')
    setMarker(roundedLatitude, roundedLongitude)

    if (fly) {
      mapRef.current?.flyTo([roundedLatitude, roundedLongitude], 15)
    }

    if (reverse) {
      try {
        nextAddress = await reverseGeocode(roundedLatitude, roundedLongitude)
      } catch {
        nextAddress = ''
      }
    }

    const nextLocation = nextAddress || `${roundedLatitude}, ${roundedLongitude}`
    setQuery(nextLocation)
    setStatus('')
    onChangeRef.current?.({
      location: nextLocation,
      latitude: roundedLatitude,
      longitude: roundedLongitude,
    })
  }, [setMarker])

  useEffect(() => {
    selectPointRef.current = selectPoint
  }, [selectPoint])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined

    const map = L.map(mapElementRef.current, {
      center: initialCoordinatesRef.current ?? MANDALAY_CENTER,
      zoom: initialCoordinatesRef.current ? 15 : DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    map.on('click', (event) => {
      void selectPointRef.current?.(event.latlng.lat, event.latlng.lng, { reverse: true, fly: false })
    })

    mapRef.current = map

    window.setTimeout(() => map.invalidateSize(), 80)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !value?.latitude || !value?.longitude) return

    setMarker(Number(value.latitude), Number(value.longitude))
  }, [setMarker, value?.latitude, value?.longitude])

  const handleSearch = async () => {
    if (!query.trim()) {
      setStatus('Enter a street, landmark, or location to search.')
      return
    }

    setLoading(true)
    setStatus('Searching location...')

    try {
      const result = await searchLocation(`${query.trim()}, Mandalay, Myanmar`)

      if (!result) {
        setStatus('No matching location found. Try a nearby landmark or click the map.')
        return
      }

      await selectPoint(result.latitude, result.longitude, {
        reverse: false,
        fly: true,
        address: result.address,
      })
    } catch {
      setStatus('Location search failed. Check your connection or click the map.')
    } finally {
      setLoading(false)
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Your browser does not support location access.')
      return
    }

    setLoading(true)
    setStatus('Requesting your current location...')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void selectPoint(coords.latitude, coords.longitude, { reverse: true, fly: true })
          .finally(() => setLoading(false))
      },
      (error) => {
        setLoading(false)
        setStatus(error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can search or click the map instead.'
          : 'Could not get your current location. You can search or click the map instead.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  return (
    <section className="location-picker profile-form-field-full">
      <div className="location-picker-heading">
        <div>
          <span>Location</span>
          <small>Search, use your current location, or click the map to place a draggable marker.</small>
        </div>
        <strong>Map coordinates</strong>
      </div>

      <div className="location-picker-search">
        <label>
          <Icon name="search" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setStatus('')
            }}
            placeholder="Search street, landmark, or location"
            aria-label="Search location"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void handleSearch()
              }
            }}
          />
        </label>
        <button type="button" className="secondary-action-button" disabled={loading} onClick={() => void handleSearch()}>
          Search
        </button>
        <button type="button" className="secondary-action-button" onClick={handleUseCurrentLocation} disabled={loading}>
          Use My Current Location
        </button>
      </div>

      <div className="location-picker-map-wrap">
        <div ref={mapElementRef} className="location-picker-map" aria-label="Select item location on map" />
      </div>

      <div className="location-preview-card">
        <span className="location-preview-icon">
          <Icon name="pin" />
        </span>
        <div>
          <strong>Selected location</strong>
          <p>{value?.location || 'No location selected yet.'}</p>
          {value?.latitude && value?.longitude ? (
            <small>{Number(value.latitude).toFixed(6)}, {Number(value.longitude).toFixed(6)}</small>
          ) : null}
        </div>
      </div>

      {status ? <p className="location-picker-status">{status}</p> : null}
    </section>
  )
}

export default LocationPicker
