import Icon from '../Icon'

function ItemsViewToggle({
  filteredCount,
  viewMode,
  onViewModeChange,
  activeFilterChips = [],
  onRemoveFilter,
}) {
  return (
    <div className="items-results-summary">
      <div className="items-results-copy">
        <span className="items-results-count">
          <strong>{filteredCount}</strong>
          <span>{filteredCount === 1 ? 'result' : 'results'} found</span>
        </span>

        {activeFilterChips.length > 0 ? (
          <div className="items-active-filters" aria-label="Active filters">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="items-filter-chip"
                onClick={() => onRemoveFilter?.(chip.key)}
                aria-label={`Remove ${chip.label} filter`}
              >
                <span>{chip.label}: {chip.value}</span>
                <Icon name="close" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="items-view-toggle" role="group" aria-label="Choose list or map view">
        <button
          type="button"
          className={`items-view-toggle-button${viewMode === 'list' ? ' is-active' : ''}`}
          onClick={() => onViewModeChange('list')}
          aria-pressed={viewMode === 'list'}
        >
          <Icon name="grid" />
          <span>List</span>
        </button>
        <button
          type="button"
          className={`items-view-toggle-button${viewMode === 'map' ? ' is-active' : ''}`}
          onClick={() => onViewModeChange('map')}
          aria-pressed={viewMode === 'map'}
        >
          <Icon name="pin" />
          <span>Map</span>
        </button>
      </div>
    </div>
  )
}

export default ItemsViewToggle
