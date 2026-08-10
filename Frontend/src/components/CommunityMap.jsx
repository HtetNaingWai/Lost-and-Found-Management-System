import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon'

const MAP_FILTERS = ['All', 'Lost Items', 'Found Items', 'Near Me']
const MANDALAY_CENTER = [21.9588, 96.0891]
const NEAR_ME_RADIUS_KM = 10

function hasValidCoordinates(post) {
  const latitude = Number(post.latitude)
  const longitude = Number(post.longitude)

  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
}

function getCoordinates(post) {
  return [Number(post.latitude), Number(post.longitude)]
}

function distanceInKm(first, second) {
  const earthRadiusKm = 6371
  const toRadians = (degrees) => degrees * (Math.PI / 180)
  const deltaLatitude = toRadians(second[0] - first[0])
  const deltaLongitude = toRadians(second[1] - first[1])
  const firstLatitude = toRadians(first[0])
  const secondLatitude = toRadians(second[0])
  const haversine = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(deltaLongitude / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function createPopupContent(post, onViewDetails) {
  const popup = document.createElement('div')
  popup.className = 'community-map-popup'
  const reportType = post.post_type ?? post.type

  const title = document.createElement('strong')
  title.textContent = post.title || 'Community report'

  const type = document.createElement('span')
  type.className = `community-map-popup-badge is-${reportType}`
  type.textContent = reportType === 'lost' ? 'Lost' : 'Found'

  if (post.image_url) {
    const image = document.createElement('img')
    image.src = post.image_url
    image.alt = post.title || 'Lost or found item'
    popup.append(image)
  }

  const location = document.createElement('p')
  location.textContent = post.location || 'Location not provided'

  const date = document.createElement('p')
  date.textContent = post.item_date ? `Date: ${post.item_date}` : ''

  const viewButton = document.createElement('button')
  viewButton.type = 'button'
  viewButton.textContent = 'View Details'
  viewButton.addEventListener('click', () => onViewDetails(post))

  popup.append(title, type, location)
  if (post.item_date) popup.append(date)
  popup.append(viewButton)
  return popup
}

function CommunityMap({
  posts,
  onViewDetails,
  title = 'Interactive Lost & Found Map',
  subtitle = 'Find lost and found items by location.',
  eyebrow = 'Explore the community',
  showControls = true,
  compact = false,
  approvedOnly = true,
}) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const onViewDetailsRef = useRef(onViewDetails)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchValue, setSearchValue] = useState('')
  const [mapStatus, setMapStatus] = useState('')
  const [userCoordinates, setUserCoordinates] = useState(null)

  useEffect(() => {
    onViewDetailsRef.current = onViewDetails
  }, [onViewDetails])

  const mappedPosts = useMemo(
    () => posts.filter((post) => (
      ['lost', 'found'].includes(post.post_type ?? post.type)
      && (!approvedOnly || post.status === 'approved')
      && hasValidCoordinates(post)
    )),
    [approvedOnly, posts],
  )

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined

    const map = L.map(mapElementRef.current, {
      center: MANDALAY_CENTER,
      zoom: 12,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    markerLayerRef.current = L.layerGroup().addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  const visiblePosts = useMemo(() => {
    if (!showControls) {
      return mappedPosts
    }

    const query = searchValue.trim().toLowerCase()

    return mappedPosts.filter((post) => {
      const type = post.post_type ?? post.type
      const matchesType = activeFilter === 'All'
        || activeFilter === 'Near Me'
        || (activeFilter === 'Lost Items' && type === 'lost')
        || (activeFilter === 'Found Items' && type === 'found')
      const matchesDistance = activeFilter !== 'Near Me'
        || !userCoordinates
        || distanceInKm(userCoordinates, getCoordinates(post)) <= NEAR_ME_RADIUS_KM
      const matchesSearch = !query || [post.title, post.location, post.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))

      return matchesType && matchesDistance && matchesSearch
    })
  }, [activeFilter, mappedPosts, searchValue, showControls, userCoordinates])

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current

    if (!map || !markerLayer) return

    markerLayer.clearLayers()

    visiblePosts.forEach((post) => {
      const type = post.post_type ?? post.type
      const icon = L.divIcon({
        className: 'community-map-marker-shell',
        html: `<span class="community-map-live-marker is-${type}"></span>`,
        iconSize: [28, 38],
        iconAnchor: [14, 38],
        popupAnchor: [0, -36],
      })
      const marker = L.marker(getCoordinates(post), { icon })
      marker.bindPopup(createPopupContent(post, (selectedPost) => onViewDetailsRef.current?.(selectedPost)))
      marker.addTo(markerLayer)
    })

    if (visiblePosts.length > 0) {
      map.fitBounds(L.latLngBounds(visiblePosts.map((post) => getCoordinates(post))), {
        padding: [36, 36],
        maxZoom: 13,
      })
      setMapStatus('')
    } else if (mappedPosts.length === 0) {
      setMapStatus('No approved lost or found reports with map coordinates are available yet.')
    } else if (activeFilter === 'Near Me' && userCoordinates) {
      setMapStatus(`No approved reports found within ${NEAR_ME_RADIUS_KM} km of your location.`)
    } else {
      setMapStatus('No reports match the current map filters.')
    }
  }, [activeFilter, mappedPosts.length, userCoordinates, visiblePosts])

  const handleFilter = (filter) => {
    setActiveFilter(filter)

    if (filter !== 'Near Me') return

    if (!navigator.geolocation || !mapRef.current) {
      setMapStatus('Your browser does not support location access.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextCoordinates = [coords.latitude, coords.longitude]
        setUserCoordinates(nextCoordinates)
        setMapStatus('')
        mapRef.current?.flyTo(nextCoordinates, 13)
      },
      () => setMapStatus('Location access was not granted. You can still explore the markers.'),
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  return (
    <section
      className={`community-map-panel${compact ? ' is-compact' : ''}`}
      aria-label="Interactive Lost and Found Map"
    >
      <div className="community-map-topline">
        <div>
          <p className="community-map-eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {showControls ? (
          <label className="community-map-search">
            <Icon name="search" />
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search lost or found items..."
              aria-label="Search lost or found items"
            />
          </label>
        ) : null}
      </div>

      {showControls ? (
        <div className="community-map-filter-row" aria-label="Map filters">
          {MAP_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter}
              className={`community-map-filter${activeFilter === filter ? ' is-active' : ''}`}
              onClick={() => handleFilter(filter)}
              aria-pressed={activeFilter === filter}
            >
              {filter}
            </button>
          ))}
        </div>
      ) : null}

      <div className="community-leaflet-map-wrap">
        <div ref={mapElementRef} className="community-leaflet-map" aria-label="Interactive lost and found map" />
        {mapStatus ? <p className="community-map-status">{mapStatus}</p> : null}
        <div className="community-map-legend" aria-label="Map legend">
          <span><i className="is-lost" />Lost</span>
          <span><i className="is-found" />Found</span>
        </div>
      </div>
    </section>
  )
}

export default CommunityMap
