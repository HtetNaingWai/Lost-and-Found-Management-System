import Icon from './Icon'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Icon name="search" />
      <span className="brand-mark-plus">
        <Icon name="plus" />
      </span>
    </span>
  )
}

export default BrandMark
