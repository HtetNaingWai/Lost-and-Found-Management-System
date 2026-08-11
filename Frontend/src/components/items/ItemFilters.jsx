import Icon from '../Icon'

const FALLBACK_FILTER_CATEGORIES = [
  'Documents',
  'Electronics',
  'Clothing',
  'Bags',
  'Keys',
  'Accessories',
  'Others',
]

function ItemFilters({
  searchValue,
  onSearchChange,
  filtersOpen,
  onToggleFilters,
  filterRef,
  draftFilters,
  activeFilterCount,
  categories = FALLBACK_FILTER_CATEGORIES,
  onDraftChange,
  onClearFilters,
  onApplyFilters,
}) {
  return (
    <>
      <div className="items-search-row">
        <label className="items-search-box">
          <Icon name="search" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search lost or found items..."
            aria-label="Search lost or found items"
          />
        </label>

        <div className="items-filter-wrap" ref={filterRef}>
          <button
            type="button"
            className={`items-filter-button${filtersOpen ? ' is-active' : ''}`}
            onClick={onToggleFilters}
            aria-expanded={filtersOpen}
          >
            <Icon name="sliders" />
            <span>Filters</span>
            {activeFilterCount > 0 ? <small>{activeFilterCount}</small> : null}
          </button>

          {filtersOpen ? (
            <div className="items-filter-popover">
              <div className="items-filter-popover-heading">
                <strong>Filter Items</strong>
                <p>Refine listings and map markers.</p>
              </div>

              <div className="items-filter-grid">
                <label className="items-filter-field">
                  <span>Category</span>
                  <select name="category" value={draftFilters.category} onChange={onDraftChange}>
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="items-filter-field">
                  <span>Date</span>
                  <select name="datePreset" value={draftFilters.datePreset} onChange={onDraftChange}>
                    <option value="any">Any Date</option>
                    <option value="today">Today</option>
                    <option value="7-days">Last 7 Days</option>
                    <option value="30-days">Last 30 Days</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </label>

                {draftFilters.datePreset === 'custom' ? (
                  <label className="items-filter-field">
                    <span>Custom Date</span>
                    <input name="customDate" type="date" value={draftFilters.customDate} onChange={onDraftChange} />
                  </label>
                ) : null}
              </div>

              <div className="items-filter-actions">
                <button type="button" className="secondary-action-button" onClick={onClearFilters}>
                  Clear
                </button>
                <button type="button" className="quick-action-button" onClick={onApplyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default ItemFilters
