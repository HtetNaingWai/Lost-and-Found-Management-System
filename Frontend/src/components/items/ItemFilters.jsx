import Icon from '../Icon'

const ITEM_FILTER_CATEGORIES = [
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
                  <span>Item Type</span>
                  <select name="itemType" value={draftFilters.itemType} onChange={onDraftChange}>
                    <option value="lost">Lost</option>
                    <option value="found">Found</option>
                  </select>
                </label>

                <label className="items-filter-field">
                  <span>Category</span>
                  <select name="category" value={draftFilters.category} onChange={onDraftChange}>
                    <option value="">All categories</option>
                    {ITEM_FILTER_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="items-filter-field">
                  <span>Location</span>
                  <input
                    name="location"
                    value={draftFilters.location}
                    onChange={onDraftChange}
                    placeholder="City, street, or area"
                  />
                </label>

                <label className="items-filter-field">
                  <span>Date</span>
                  <input name="date" type="date" value={draftFilters.date} onChange={onDraftChange} />
                </label>
              </div>

              <div className="items-filter-actions">
                <button type="button" className="secondary-action-button" onClick={onClearFilters}>
                  Clear Filters
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
