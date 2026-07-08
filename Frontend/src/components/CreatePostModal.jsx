import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/constants'
import { apiRequest } from '../services/api'

function CreatePostModal({
  open,
  onClose,
  token,
  categories,
  onCreatePost,
}) {
  const [values, setValues] = useState({
    postType: 'community',
    content: '',
    itemTitle: '',
    categoryId: '',
    location: '',
    itemDate: '',
  })
  const [imageState, setImageState] = useState({ file: null, preview: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      if (imageState.preview) URL.revokeObjectURL(imageState.preview)
      setImageState({ file: null, preview: '' })
      setValues({
        postType: 'community',
        content: '',
        itemTitle: '',
        categoryId: '',
        location: '',
        itemDate: '',
      })
      setError('')
      setSubmitting(false)
    }
  }, [open])

  if (!open) return null

  const isItemPost = values.postType === 'lost' || values.postType === 'found'

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setError('')
  }

  const handleSelectFile = (file) => {
    setError('')

    if (!file) return

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be 2MB or smaller.')
      return
    }

    setImageState((current) => {
      if (current.preview) URL.revokeObjectURL(current.preview)
      return { file, preview: URL.createObjectURL(file) }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('post_type', values.postType)
      formData.append('content', values.content)

      if (isItemPost) {
        formData.append('title', values.itemTitle)
        formData.append('category_id', values.categoryId)
        formData.append('location', values.location)
        formData.append('item_date', values.itemDate)
      }

      if (imageState.file) {
        formData.append('image', imageState.file)
      }

      const payload = await apiRequest('/community-posts', {
        method: 'POST',
        token,
        body: formData,
      })

      onCreatePost(payload.post)
      onClose()
    } catch (requestError) {
      setError(requestError.payload?.message ?? 'Failed to create post.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="community-modal-root" onClick={onClose}>
      <div className="community-modal-overlay" />
      <div className="community-modal-shell">
        <section
          className="community-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="community-modal-top">
            <div>
              <h2 id="create-post-title">Create Community Post</h2>
              <p>Share a lost item, found item, or community update.</p>
            </div>
            <button type="button" className="modal-close-button" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Post Type</span>
                <select name="postType" value={values.postType} onChange={handleChange}>
                  <option value="community">Community Post</option>
                  <option value="lost">Lost Item</option>
                  <option value="found">Found Item</option>
                </select>
              </label>

              {isItemPost ? (
                <label className="profile-form-field">
                  <span>Category</span>
                  <select name="categoryId" value={values.categoryId} onChange={handleChange}>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {isItemPost ? (
                <label className="profile-form-field">
                  <span>Item Title</span>
                  <input name="itemTitle" value={values.itemTitle} onChange={handleChange} />
                </label>
              ) : null}

              {isItemPost ? (
                <label className="profile-form-field">
                  <span>Location</span>
                  <input name="location" value={values.location} onChange={handleChange} />
                </label>
              ) : null}

              {isItemPost ? (
                <label className="profile-form-field">
                  <span>Item Date</span>
                  <input name="itemDate" type="date" value={values.itemDate} onChange={handleChange} />
                </label>
              ) : null}

              <label className="profile-form-field profile-form-field-full">
                <span>Post Content</span>
                <textarea
                  name="content"
                  rows="5"
                  placeholder="What would you like to share with the community?"
                  value={values.content}
                  onChange={handleChange}
                />
              </label>

              <div className="profile-form-field profile-form-field-full">
                <span>Image Upload</span>
                <div
                  className={`upload-box${imageState.preview ? ' has-file' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      inputRef.current?.click()
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    handleSelectFile(event.dataTransfer.files?.[0] ?? null)
                  }}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    hidden
                    onChange={(event) => {
                      handleSelectFile(event.target.files?.[0] ?? null)
                      event.target.value = ''
                    }}
                  />

                  {imageState.preview ? (
                    <div className="upload-preview">
                      <img src={imageState.preview} alt="Post preview" />
                      <div className="upload-preview-meta">
                        <strong>{imageState.file?.name}</strong>
                        <span>{Math.round((imageState.file?.size ?? 0) / 1024)} KB</span>
                        <button
                          type="button"
                          className="upload-remove"
                          onClick={(event) => {
                            event.stopPropagation()
                            if (imageState.preview) URL.revokeObjectURL(imageState.preview)
                            setImageState({ file: null, preview: '' })
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-empty">
                      <span className="upload-icon">
                        <Icon name="upload" />
                      </span>
                      <strong>Drag and drop image here</strong>
                      <span>or click to upload</span>
                      <small>Accepted files: JPG, PNG, WEBP · Max size: 2MB</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error ? <p className="settings-feedback is-error">{error}</p> : null}

            <div className="community-modal-actions">
              <button type="button" className="secondary-action-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="quick-action-button" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default CreatePostModal
