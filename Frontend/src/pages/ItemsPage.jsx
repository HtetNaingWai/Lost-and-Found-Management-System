import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CommunityMap from '../components/CommunityMap'
import DashboardPageShell from '../components/DashboardPageShell'
import PostDetailModal from '../components/PostDetailModal'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'
import ItemsViewToggle from '../components/items/ItemsViewToggle'

function normalizeItemValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function ItemsPage({ type, items, user, onStartMessage, myClaims = [], onSubmitClaim, submittingClaim }) {
  const [selectedPost, setSelectedPost] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [draftFilters, setDraftFilters] = useState({
    itemType: type,
    category: '',
    location: '',
    date: '',
  })
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    location: '',
    date: '',
  })
  const filterRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setDraftFilters((current) => ({ ...current, itemType: type }))
  }, [type])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!filterRef.current?.contains(event.target)) {
        setFiltersOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const baseItems = useMemo(
    () => items.filter((item) => normalizeItemValue(item.post_type ?? item.type) === type),
    [items, type],
  )

  const filtered = useMemo(() => {
    const query = normalizeItemValue(searchValue)
    const category = normalizeItemValue(activeFilters.category)
    const location = normalizeItemValue(activeFilters.location)
    const date = activeFilters.date

    return baseItems.filter((item) => {
      const title = normalizeItemValue(item.title)
      const description = normalizeItemValue(item.content ?? item.description)
      const categoryName = normalizeItemValue(item.category?.name)
      const itemLocation = normalizeItemValue(item.location)
      const itemDate = String(item.item_date || item.date || '')

      const matchesSearch = !query || title.includes(query) || description.includes(query)
      const matchesCategory = !category || categoryName === category
      const matchesLocation = !location || itemLocation.includes(location)
      const matchesDate = !date || itemDate === date

      return matchesSearch && matchesCategory && matchesLocation && matchesDate
    })
  }, [activeFilters, baseItems, searchValue])

  const activeFilterCount = [
    activeFilters.category,
    activeFilters.location,
    activeFilters.date,
  ].filter(Boolean).length

  const handleDraftChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((current) => ({ ...current, [name]: value }))
  }

  const handleApplyFilters = () => {
    setActiveFilters({
      category: draftFilters.category,
      location: draftFilters.location,
      date: draftFilters.date,
    })
    setFiltersOpen(false)

    if (draftFilters.itemType !== type) {
      navigate(draftFilters.itemType === 'lost' ? '/lost-items' : '/found-items')
    }
  }

  const handleClearFilters = () => {
    const resetFilters = {
      itemType: type,
      category: '',
      location: '',
      date: '',
    }

    setSearchValue('')
    setDraftFilters(resetFilters)
    setActiveFilters({
      category: '',
      location: '',
      date: '',
    })
    setFiltersOpen(false)
  }

  return (
    <>
      <DashboardPageShell>
        <section className="items-discovery-panel" aria-label={`${type} item search and filters`}>
          <ItemFilters
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((current) => !current)}
            filterRef={filterRef}
            draftFilters={draftFilters}
            activeFilterCount={activeFilterCount}
            onDraftChange={handleDraftChange}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
          />

          <ItemsViewToggle
            filteredCount={filtered.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </section>

        {viewMode === 'map' ? (
          <CommunityMap
            posts={filtered}
            onViewDetails={setSelectedPost}
            showControls={false}
            compact
            eyebrow={`${type === 'lost' ? 'Lost' : 'Found'} item locations`}
            title={`${type === 'lost' ? 'Lost' : 'Found'} Items Map`}
            subtitle="Map markers update with your search and filters."
          />
        ) : (
          <div className="recent-items-grid">
            {filtered.map((item) => (
              <ItemCard
                key={`${item.id}-${item.title}`}
                item={item}
                type={type}
                onClick={() => setSelectedPost(item)}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="items-empty-state">
            <strong>No matching items found.</strong>
            <p>Try adjusting your search keyword, category, location, or date filter.</p>
          </div>
        ) : null}
      </DashboardPageShell>

      <PostDetailModal
        post={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedPost(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
        existingClaim={myClaims.find((claim) => claim.community_post?.id === selectedPost?.id)}
        onSubmitClaim={onSubmitClaim}
        submittingClaim={submittingClaim}
      />
    </>
  )
}

export default ItemsPage
