import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Icon from './Icon'
import { resolveImageUrl } from '../utils/imageUrl'

const MAP_FILTERS = ['All', 'Lost Items', 'Found Items', 'Near Me']
const MANDALAY_CENTER = [21.9588, 96.0891]
const LOCAL_MAP_BOUNDS = [
  [9.5, 92],
  [28.8, 102.5],
]
const NEAR_ME_RADIUS_KM = 10
const CATEGORY_MARKER_PATHS = {
  bags: 'M7 8V7a5 5 0 0 1 10 0v1h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Zm2 0h6V7a3 3 0 0 0-6 0Zm-2 4h2v2H7Zm8 0h2v2h-2Z',
  documents: 'M6 3h9l4 4v14H6Zm8 1.8V8h3.2ZM8 11h8v2H8Zm0 4h8v2H8Zm0-8h4v2H8Z',
  electronics: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 3v13h8V5Zm3 14h2v1h-2Z',
  keys: 'M7.5 14a4.5 4.5 0 1 1 3.88-6.78L22 17.84 19.84 20l-2.12-2.12-1.77 1.77-2.12-2.12-1.9 1.9-2.58-2.58A4.48 4.48 0 0 1 7.5 14Zm0-3A1.5 1.5 0 1 0 6 9.5 1.5 1.5 0 0 0 7.5 11Z',
  clothing: 'M8 4 5 6.2 2 9l3 4 2-1.3V21h10v-9.3l2 1.3 3-4-3-2.8L16 4a4 4 0 0 1-8 0Zm2.1 0h3.8A2 2 0 0 1 12 5.2 2 2 0 0 1 10.1 4Z',
  accessories: 'M7 7h10a4 4 0 0 1 4 4v7H3v-7a4 4 0 0 1 4-4Zm0 2a2 2 0 0 0-2 2v1h14v-1a2 2 0 0 0-2-2Zm-2 7h14v-2H5Zm4-12h6v2H9Z',
  others: 'M12 2 3 7v10l9 5 9-5V7Zm0 2.3 5.9 3.3L12 10.9 6.1 7.6Zm-7 5 6 3.3v6.2l-6-3.3Zm8 9.5v-6.2l6-3.3v6.2Z',
}

function getPostType(post) {
  return (post.post_type ?? post.type ?? '').toLowerCase()
}

function getPostStatus(post) {
  return (post.status ?? '').toLowerCase()
}

function getCategoryKey(post) {
  const categoryName = String(post.category?.name ?? '').trim().toLowerCase()

  if (categoryName.includes('bag')) return 'bags'
  if (categoryName.includes('document') || categoryName.includes('nrc') || categoryName.includes('id')) return 'documents'
  if (categoryName.includes('electronic') || categoryName.includes('phone') || categoryName.includes('device')) return 'electronics'
  if (categoryName.includes('key')) return 'keys'
  if (categoryName.includes('cloth') || categoryName.includes('shirt')) return 'clothing'
  if (categoryName.includes('accessor') || categoryName.includes('wallet') || categoryName.includes('watch')) return 'accessories'

  return 'others'
}

function getCategoryLabel(post) {
  return post.category?.name || 'Others'
}

function hasValidCoordinates(post) {
  const latitude = Number(post.latitude)
  const longitude = Number(post.longitude)

  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180
    && !(latitude === 0 && longitude === 0)
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

function createMarkerIcon(post) {
  const type = getPostType(post)
  const categoryKey = getCategoryKey(post)
  const iconPath = CATEGORY_MARKER_PATHS[categoryKey] ?? CATEGORY_MARKER_PATHS.others

  return L.divIcon({
    className: 'community-map-marker-shell',
    html: `
      <span class="community-map-live-marker is-${type}" data-category="${categoryKey}">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="${iconPath}"></path>
        </svg>
      </span>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  })
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
  showRecentPanel = false,
}) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const markerRefs = useRef(new Map())
  const onViewDetailsRef = useRef(onViewDetails)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchValue, setSearchValue] = useState('')
  const [mapStatus, setMapStatus] = useState('')
  const [userCoordinates, setUserCoordinates] = useState(null)
  const [selectedMapPost, setSelectedMapPost] = useState(null)

  useEffect(() => {
    onViewDetailsRef.current = onViewDetails
  }, [onViewDetails])

  const mappedPosts = useMemo(
    () => posts.filter((post) => (
      ['lost', 'found'].includes(getPostType(post))
      && (!approvedOnly || getPostStatus(post) === 'approved')
      && hasValidCoordinates(post)
    )),
    [approvedOnly, posts],
  )

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) return undefined

    const map = L.map(mapElementRef.current, {
      center: MANDALAY_CENTER,
      zoom: 13,
      minZoom: 6,
      zoomControl: false,
      scrollWheelZoom: true,
      maxBounds: LOCAL_MAP_BOUNDS,
      maxBoundsViscosity: 0.45,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapRef.current = map
    markerLayerRef.current = L.layerGroup().addTo(map)
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      markerLayerRef.current = null
    }
  }, [])

  const filterBasePosts = useMemo(() => {
    if (!showControls) {
      return mappedPosts
    }

    const query = searchValue.trim().toLowerCase()

    return mappedPosts.filter((post) => {
      const matchesDistance = activeFilter !== 'Near Me'
        || !userCoordinates
        || distanceInKm(userCoordinates, getCoordinates(post)) <= NEAR_ME_RADIUS_KM
      const matchesSearch = !query || [post.title, post.content, post.description, post.location, post.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))

      return matchesDistance && matchesSearch
    })
  }, [activeFilter, mappedPosts, searchValue, showControls, userCoordinates])

  const visiblePosts = useMemo(() => {
    if (!showControls || activeFilter === 'All' || activeFilter === 'Near Me') {
      return filterBasePosts
    }

    return filterBasePosts.filter((post) => {
      const type = getPostType(post)

      return (activeFilter === 'Lost Items' && type === 'lost')
        || (activeFilter === 'Found Items' && type === 'found')
    })
  }, [activeFilter, filterBasePosts, showControls])

  const summaryCounts = useMemo(() => {
    const lost = filterBasePosts.filter((post) => getPostType(post) === 'lost').length
    const found = filterBasePosts.filter((post) => getPostType(post) === 'found').length

    return {
      lost,
      found,
      total: lost + found,
    }
  }, [filterBasePosts])

  const recentMappedPosts = useMemo(
    () => [...visiblePosts]
      .sort((left, right) => new Date(right.created_at ?? right.item_date ?? 0) - new Date(left.created_at ?? left.item_date ?? 0))
      .slice(0, 5),
    [visiblePosts],
  )
  const shouldShowRecentPanel = showRecentPanel && !compact && recentMappedPosts.length > 0

  useEffect(() => {
    const map = mapRef.current
    const markerLayer = markerLayerRef.current

    if (!map || !markerLayer) return

    map.invalidateSize()

    markerLayer.clearLayers()
    markerRefs.current.clear()

    visiblePosts.forEach((post) => {
      const marker = L.marker(getCoordinates(post), { icon: createMarkerIcon(post) })
      marker.on('click', () => {
        try {
          if (!post?.id) {
            setMapStatus('This report cannot be opened because its item data is incomplete.')
            setSelectedMapPost(null)
            return
          }

          setSelectedMapPost(post)
          setMapStatus('')
        } catch {
          setMapStatus('We could not open this map item. Please try another marker.')
          setSelectedMapPost(null)
        }
      })
      marker.addTo(markerLayer)
      markerRefs.current.set(post.id, marker)
    })

    if (visiblePosts.length > 0) {
      map.fitBounds(L.latLngBounds(visiblePosts.map((post) => getCoordinates(post))), {
        padding: [36, 36],
        maxZoom: 13,
      })
      setMapStatus('')
    } else if (mappedPosts.length === 0) {
      setSelectedMapPost(null)
      setMapStatus('No approved lost or found reports with map coordinates are available yet.')
    } else if (activeFilter === 'Near Me' && userCoordinates) {
      setSelectedMapPost(null)
      setMapStatus(`No approved reports found within ${NEAR_ME_RADIUS_KM} km of your location.`)
    } else {
      setSelectedMapPost(null)
      setMapStatus('No reports match the current map filters.')
    }
  }, [activeFilter, mappedPosts.length, userCoordinates, visiblePosts])

  const handleRecentItemClick = (post) => {
    const marker = markerRefs.current.get(post.id)
    const map = mapRef.current

    if (!marker || !map) {
      onViewDetailsRef.current?.(post)
      return
    }

    map.flyTo(getCoordinates(post), Math.max(map.getZoom(), 14), {
      duration: 0.45,
    })
    setSelectedMapPost(post)
  }

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
      {showControls ? (
        <div className="community-map-topline">
          <div>
            <p className="community-map-eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
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
        </div>
      ) : null}

      <div className={`community-map-content-grid${shouldShowRecentPanel ? ' has-recent-panel' : ''}`}>
        <div className="community-leaflet-map-wrap">
          <div ref={mapElementRef} className="community-leaflet-map" aria-label="Interactive lost and found map" />
          {mapStatus ? <p className="community-map-status">{mapStatus}</p> : null}
          {showControls ? (
            <div className="community-map-filter-row" aria-label="Map filters">
              {MAP_FILTERS.map((filter) => {
                const isLost = filter === 'Lost Items'
                const isFound = filter === 'Found Items'
                const count = isLost ? summaryCounts.lost : isFound ? summaryCounts.found : null

                return (
                  <button
                    type="button"
                    key={filter}
                    className={`community-map-filter${activeFilter === filter ? ' is-active' : ''}${isLost ? ' is-lost' : ''}${isFound ? ' is-found' : ''}`}
                    onClick={() => handleFilter(filter)}
                    aria-pressed={activeFilter === filter}
                  >
                    {isLost ? 'Lost' : isFound ? 'Found' : filter}
                    {count !== null ? <strong>{count}</strong> : null}
                  </button>
                )
              })}
            </div>
          ) : null}
          <div className="community-map-legend" aria-label="Map legend">
            <span><i className="is-lost" />Lost</span>
            <span><i className="is-found" />Found</span>
          </div>
          {selectedMapPost ? (
            <article className="community-map-preview-card" aria-live="polite">
              <button
                type="button"
                className="community-map-preview-close"
                onClick={() => setSelectedMapPost(null)}
                aria-label="Close map item preview"
              >
                <Icon name="close" />
              </button>
              <div className="community-map-preview-image">
                {resolveImageUrl(selectedMapPost.image_url ?? selectedMapPost.imageUrl ?? selectedMapPost.image) ? (
                  <img
                    src={resolveImageUrl(selectedMapPost.image_url ?? selectedMapPost.imageUrl ?? selectedMapPost.image)}
                    alt={selectedMapPost.title || 'Lost or found item'}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <Icon name="inventory" />
                )}
              </div>
              <div className="community-map-preview-copy">
                <span className={`community-map-popup-badge is-${getPostType(selectedMapPost)}`}>
                  {getPostType(selectedMapPost) === 'lost' ? 'Lost' : 'Found'}
                </span>
                <h3>{selectedMapPost.title || 'Untitled report'}</h3>
                <p>{getCategoryLabel(selectedMapPost)}</p>
                <p>{selectedMapPost.location || 'Location not provided'}</p>
                <p>{selectedMapPost.item_date || 'Date not provided'}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedMapPost?.id || selectedMapPost?.deleted_at) {
                      setMapStatus('This report is no longer available.')
                      setSelectedMapPost(null)
                      return
                    }

                    onViewDetailsRef.current?.(selectedMapPost)
                  }}
                >
                  View Details
                </button>
              </div>
            </article>
          ) : null}
        </div>

        {shouldShowRecentPanel ? (
          <aside className="community-map-recent-panel" aria-label="Recent items on map">
            <div className="community-map-recent-heading">
              <strong>Recent Items on Map</strong>
              <span>{recentMappedPosts.length} shown</span>
            </div>
            <div className="community-map-recent-list">
              {recentMappedPosts.map((post) => {
                const type = getPostType(post)
                const categoryKey = getCategoryKey(post)

                return (
                  <button
                    type="button"
                    className="community-map-recent-item"
                    key={`map-recent-${post.id}`}
                    onClick={() => handleRecentItemClick(post)}
                  >
                    <span className={`community-map-recent-icon is-${type}`} data-category={categoryKey}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d={CATEGORY_MARKER_PATHS[categoryKey] ?? CATEGORY_MARKER_PATHS.others} />
                      </svg>
                    </span>
                    <span className="community-map-recent-copy">
                      <strong>{post.title || 'Untitled item'}</strong>
                      <small>{post.item_date || 'Recent report'}</small>
                    </span>
                    <span className={`community-map-popup-badge is-${type}`}>
                      {type === 'lost' ? 'Lost' : 'Found'}
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  )
}

export default CommunityMap
