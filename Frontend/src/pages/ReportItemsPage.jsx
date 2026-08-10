import { useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import LocationPicker from '../components/LocationPicker'
import { apiRequest } from '../services/api'

function ReportItemsPage({ token, categories, myItems, onItemSubmitted }) {
  const [selectedType, setSelectedType] = useState('lost')
  const [values, setValues] = useState({
    category_id: '',
    title: '',
    location: '',
    latitude: '',
    longitude: '',
    item_date: '',
    description: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const cards = [
    {
      type: 'lost',
      title: 'Report Lost Item',
      description:
        'Use this if you lost something and want the community to help find it.',
      button: 'Start Lost Report',
      icon: 'search',
    },
    {
      type: 'found',
      title: 'Report Found Item',
      description:
        'Use this if you found something and want to return it to the owner.',
      button: 'Start Found Report',
      icon: 'inventory',
    },
  ]

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess('')

    if (!values.location.trim() || !values.latitude || !values.longitude) {
      setError('Please select the item location on the map.')
      setSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append('post_type', selectedType)
    formData.append('category_id', values.category_id)
    formData.append('title', values.title)
    formData.append('location', values.location)
    formData.append('latitude', values.latitude)
    formData.append('longitude', values.longitude)
    formData.append('item_date', values.item_date)
    formData.append('content', values.description)

    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      const payload = await apiRequest('/community-posts', {
        method: 'POST',
        token,
        body: formData,
      })

      onItemSubmitted(payload.post)
      setSuccess(payload.message)
      setValues({
        category_id: '',
        title: '',
        location: '',
        latitude: '',
        longitude: '',
        item_date: '',
        description: '',
      })
      setImageFile(null)
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to submit item report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardPageShell>
      <div className="report-choice-grid">
        {cards.map((card) => (
          <article className="report-choice-card" key={card.title}>
            <span className="report-choice-icon">
              <Icon name={card.icon} />
            </span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <button
              type="button"
              className="quick-action-button"
              onClick={() => {
                setSelectedType(card.type)
                setSuccess('')
                setError('')
              }}
            >
              {card.button}
            </button>
          </article>
        ))}
      </div>

      <section className="dashboard-panel report-form-panel">
        <div className="section-panel-heading">
          <h2>{selectedType === 'lost' ? 'Lost Item Form' : 'Found Item Form'}</h2>
          <p>Complete the details below. Your submission will appear in the admin control panel for review.</p>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <label className="profile-form-field">
              <span>Category</span>
              <select name="category_id" value={values.category_id} onChange={handleChange}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="profile-form-field">
              <span>Item Title</span>
              <input name="title" value={values.title} onChange={handleChange} />
            </label>
            <LocationPicker
              value={{
                location: values.location,
                latitude: values.latitude,
                longitude: values.longitude,
              }}
              onChange={(nextLocation) => {
                setValues((current) => ({ ...current, ...nextLocation }))
                setError('')
                setSuccess('')
              }}
            />
            <label className="profile-form-field">
              <span>Date</span>
              <input name="item_date" type="date" value={values.item_date} onChange={handleChange} />
            </label>
            <label className="profile-form-field profile-form-field-full">
              <span>Description</span>
              <textarea
                name="description"
                rows="5"
                value={values.description}
                onChange={handleChange}
              />
            </label>
            <label className="profile-form-field profile-form-field-full">
              <span>Image</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {error ? <p className="settings-feedback is-error">{error}</p> : null}
          {success ? <p className="settings-feedback is-success">{success}</p> : null}

          <div className="profile-form-actions">
            <button type="submit" className="quick-action-button" disabled={submitting}>
              {submitting ? 'Submitting...' : selectedType === 'lost' ? 'Submit Lost Item' : 'Submit Found Item'}
            </button>
          </div>
        </form>
      </section>

      <section className="dashboard-panel">
        <div className="section-panel-heading">
          <h2>My Recent Reports</h2>
          <p>Your latest submitted items and their review status.</p>
        </div>
        <div className="admin-list">
          {myItems.length > 0 ? (
            myItems.slice(0, 5).map((item) => (
              <article className="admin-list-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.location}</p>
                </div>
                <div className="admin-list-meta">
                  <span className={`badge badge-type ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`}>
                    {item.type}
                  </span>
                  <span className={`badge badge-status badge-${item.status?.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
              </article>
            ))
          ) : (
            <div className="settings-note">No reports submitted yet.</div>
          )}
        </div>
      </section>
    </DashboardPageShell>
  )
}

export default ReportItemsPage
