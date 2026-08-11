import { useEffect, useMemo, useRef, useState } from 'react'
import CommunityMap from '../components/CommunityMap'
import DashboardPageShell from '../components/DashboardPageShell'
import PostDetailModal from '../components/PostDetailModal'
import ItemCard from '../components/items/ItemCard'
import ItemFilters from '../components/items/ItemFilters'
import ItemsViewToggle from '../components/items/ItemsViewToggle'

const ITEMS_PER_PAGE = 6

function normalizeItemValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeDateValue(value) {
  return String(value ?? '').slice(0, 10)
}

function getStartOfDay(date) {
  const nextDate = new Date(date)
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

function getDateFilterLabel(filters) {
  if (filters.datePreset === 'today') return 'Today'
  if (filters.datePreset === '7-days') return 'Last 7 Days'
  if (filters.datePreset === '30-days') return 'Last 30 Days'
  if (filters.datePreset === 'custom' && filters.customDate) return filters.customDate
  return ''
}

function itemMatchesDateFilter(itemDateValue, filters) {
  if (!filters.datePreset || filters.datePreset === 'any') {
    return true
  }

  const normalizedItemDate = normalizeDateValue(itemDateValue)

  if (!normalizedItemDate) {
    return false
  }

  if (filters.datePreset === 'custom') {
    return !filters.customDate || normalizedItemDate === filters.customDate
  }

  const itemDate = getStartOfDay(normalizedItemDate)
  const today = getStartOfDay(new Date())

  if (filters.datePreset === 'today') {
    return itemDate.getTime() === today.getTime()
  }

  const rangeDays = filters.datePreset === '7-days' ? 7 : 30
  const rangeStart = new Date(today)
  rangeStart.setDate(today.getDate() - (rangeDays - 1))

  return itemDate >= rangeStart && itemDate <= today
}

function ItemsPage({
  type,
  items,
  user,
  onStartMessage,
  onUserProfileClick,
  myClaims = [],
  onSubmitClaim,
  submittingClaim,
  savedPostsState,
}) {
  const [selectedPost, setSelectedPost] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState({
    category: '',
    datePreset: 'any',
    customDate: '',
  })
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    datePreset: 'any',
    customDate: '',
  })
  const filterRef = useRef(null)
  const {
    isSaved = () => false,
    toggleSaved = () => {},
    savingPostId = null,
  } = savedPostsState ?? {}

  const baseItems = useMemo(
    () => items.filter((item) => normalizeItemValue(item.post_type ?? item.type) === type),
    [items, type],
  )

  const categoryOptions = useMemo(() => {
    const categorySet = new Set(
      baseItems
        .map((item) => item.category?.name)
        .filter(Boolean),
    )

    return Array.from(categorySet).sort((left, right) => left.localeCompare(right))
  }, [baseItems])

  const filtered = useMemo(() => {
    const query = normalizeItemValue(searchValue)
    const category = normalizeItemValue(activeFilters.category)

    return baseItems.filter((item) => {
      const title = normalizeItemValue(item.title)
      const description = normalizeItemValue(item.content ?? item.description)
      const categoryName = normalizeItemValue(item.category?.name)
      const itemDate = item.item_date || item.date || ''

      const matchesSearch = !query || title.includes(query) || description.includes(query) || categoryName.includes(query)
      const matchesCategory = !category || categoryName === category
      const matchesDate = itemMatchesDateFilter(itemDate, activeFilters)

      return matchesSearch && matchesCategory && matchesDate
    })
  }, [activeFilters, baseItems, searchValue])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [currentPage, filtered])

  const activeFilterCount = [
    activeFilters.category,
    getDateFilterLabel(activeFilters),
  ].filter(Boolean).length

  const activeFilterChips = useMemo(() => {
    const chips = []
    const dateLabel = getDateFilterLabel(activeFilters)

    if (activeFilters.category) {
      chips.push({ key: 'category', label: 'Category', value: activeFilters.category })
    }

    if (dateLabel) {
      chips.push({ key: 'date', label: 'Date', value: dateLabel })
    }

    return chips
  }, [activeFilters])

  const handleDraftChange = (event) => {
    const { name, value } = event.target
    setDraftFilters((current) => ({ ...current, [name]: value }))
  }

  const handleSearchChange = (value) => {
    setSearchValue(value)
    setCurrentPage(1)
  }

  const handleApplyFilters = () => {
    setActiveFilters({
      category: draftFilters.category,
      datePreset: draftFilters.datePreset,
      customDate: draftFilters.customDate,
    })
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  const handleClearFilters = () => {
    const resetFilters = {
      category: '',
      datePreset: 'any',
      customDate: '',
    }

    setDraftFilters(resetFilters)
    setActiveFilters(resetFilters)
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  const handleRemoveFilter = (filterKey) => {
    const nextFilters = {
      ...activeFilters,
      ...(filterKey === 'category' ? { category: '' } : {}),
      ...(filterKey === 'date' ? { datePreset: 'any', customDate: '' } : {}),
    }

    setActiveFilters(nextFilters)
    setDraftFilters(nextFilters)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  useEffect(() => {
    if (!filtersOpen) {
      return undefined
    }

    const handleClickOutside = (event) => {
      if (!filterRef.current?.contains(event.target)) {
        setFiltersOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [filtersOpen])

  const paginationPages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1)
    }

    const pages = new Set([1, totalPages, currentPage])

    if (currentPage > 2) pages.add(currentPage - 1)
    if (currentPage < totalPages - 1) pages.add(currentPage + 1)

    return Array.from(pages).sort((left, right) => left - right)
  }, [currentPage, totalPages])

  return (
    <>
      <DashboardPageShell>
        <section className="items-discovery-panel" aria-label={`${type} item search and filters`}>
          <ItemFilters
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((current) => !current)}
            filterRef={filterRef}
            draftFilters={draftFilters}
            activeFilterCount={activeFilterCount}
            categories={categoryOptions.length > 0 ? categoryOptions : undefined}
            onDraftChange={handleDraftChange}
            onClearFilters={handleClearFilters}
            onApplyFilters={handleApplyFilters}
          />

          <ItemsViewToggle
            filteredCount={filtered.length}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilterChips={activeFilterChips}
            onRemoveFilter={handleRemoveFilter}
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
          <>
            <div className="recent-items-grid items-result-grid">
              {paginatedItems.map((item) => (
                <ItemCard
                  key={`${item.id}-${item.title}`}
                  item={item}
                  type={type}
                  onClick={() => setSelectedPost(item)}
                  onUserProfileClick={onUserProfileClick}
                  isSaved={isSaved(item.id)}
                  onToggleSave={toggleSaved}
                  savingSave={savingPostId === item.id}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="items-pagination" aria-label={`${type} items pagination`}>
                <button
                  type="button"
                  className="items-pagination-button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>

                {paginationPages.map((pageNumber, index) => {
                  const previousPage = paginationPages[index - 1]
                  const shouldShowGap = previousPage && pageNumber - previousPage > 1

                  return (
                    <span key={pageNumber} className="items-pagination-group">
                      {shouldShowGap ? <span className="items-pagination-ellipsis">…</span> : null}
                      <button
                        type="button"
                        className={`items-pagination-button${currentPage === pageNumber ? ' is-active' : ''}`}
                        onClick={() => setCurrentPage(pageNumber)}
                        aria-current={currentPage === pageNumber ? 'page' : undefined}
                      >
                        {pageNumber}
                      </button>
                    </span>
                  )
                })}

                <button
                  type="button"
                  className="items-pagination-button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </nav>
            ) : null}
          </>
        )}

        {filtered.length === 0 ? (
          <div className="items-empty-state">
            <strong>No matching items found.</strong>
            <p>Try adjusting your search keyword, category, or date filter.</p>
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
        onUserProfileClick={(profileUser) => {
          setSelectedPost(null)
          onUserProfileClick?.(profileUser)
        }}
        existingClaim={myClaims.find((claim) => claim.community_post?.id === selectedPost?.id)}
        onSubmitClaim={onSubmitClaim}
        submittingClaim={submittingClaim}
        isSaved={selectedPost ? isSaved(selectedPost.id) : false}
        onToggleSave={selectedPost ? () => toggleSaved(selectedPost) : undefined}
        savingSave={selectedPost ? savingPostId === selectedPost.id : false}
      />
    </>
  )
}

export default ItemsPage
