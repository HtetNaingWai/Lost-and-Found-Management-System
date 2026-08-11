import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import RatingModal from '../components/ratings/RatingModal'
import RatingSummary from '../components/ratings/RatingSummary'
import ReviewList from '../components/ratings/ReviewList'
import { apiRequest } from '../services/api'
import { formatDate } from '../utils/formatDate'
import { getPresenceStatus } from '../utils/presence'

function ProfilePage({ user, token, onUserUpdate }) {
  const navigate = useNavigate()
  const presenceStatus = getPresenceStatus(user)
  const [profileValues, setProfileValues] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    nrc_no: user.nrc_no || '',
  })
  const [passwordValues, setPasswordValues] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [privacyValues, setPrivacyValues] = useState({
    show_phone_publicly: Boolean(user.show_phone_publicly),
    show_email_publicly: Boolean(user.show_email_publicly),
    show_location_publicly: Boolean(user.show_location_publicly),
    public_location: user.public_location || '',
  })
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [privacyError, setPrivacyError] = useState('')
  const [privacySuccess, setPrivacySuccess] = useState('')
  const [ratingsPayload, setRatingsPayload] = useState({
    rating_summary: { average: null, count: 0 },
    recent_reviews: [],
  })
  const [ratingsError, setRatingsError] = useState('')
  const [loadingRatings, setLoadingRatings] = useState(false)
  const [pendingRatings, setPendingRatings] = useState([])
  const [pendingRatingsError, setPendingRatingsError] = useState('')
  const [loadingPendingRatings, setLoadingPendingRatings] = useState(false)
  const [ratingClaim, setRatingClaim] = useState(null)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  })
  const photoInputRef = useRef(null)

  useEffect(() => {
    setProfileValues({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      nrc_no: user.nrc_no || '',
    })
    setPrivacyValues({
      show_phone_publicly: Boolean(user.show_phone_publicly),
      show_email_publicly: Boolean(user.show_email_publicly),
      show_location_publicly: Boolean(user.show_location_publicly),
      public_location: user.public_location || '',
    })
  }, [user])

  useEffect(() => {
    let cancelled = false

    setLoadingRatings(true)
    setRatingsError('')

    apiRequest(`/users/${user.id}/public-profile`, { token })
      .then((payload) => {
        if (!cancelled) {
          setRatingsPayload({
            rating_summary: payload.rating_summary ?? { average: null, count: 0 },
            recent_reviews: payload.recent_reviews ?? [],
          })
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setRatingsError(error.payload?.message ?? 'Failed to load your reviews.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRatings(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, user.id])

  useEffect(() => {
    let cancelled = false

    setLoadingPendingRatings(true)
    setPendingRatingsError('')

    apiRequest('/ratings/pending', { token })
      .then((payload) => {
        if (!cancelled) setPendingRatings(payload.ratings ?? [])
      })
      .catch((error) => {
        if (!cancelled) {
          setPendingRatingsError(error.payload?.message ?? 'Failed to load reviews to give.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPendingRatings(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  const handleProfileChange = (event) => {
    const { name, value } = event.target
    setProfileValues((current) => ({ ...current, [name]: value }))
    setProfileError('')
    setProfileSuccess('')
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordValues((current) => ({ ...current, [name]: value }))
    setPasswordError('')
    setPasswordSuccess('')
  }

  const handlePrivacyToggle = (name) => {
    setPrivacyValues((current) => ({
      ...current,
      [name]: !current[name],
    }))
    setPrivacyError('')
    setPrivacySuccess('')
  }

  const handlePrivacyLocationChange = (event) => {
    setPrivacyValues((current) => ({
      ...current,
      public_location: event.target.value,
    }))
    setPrivacyError('')
    setPrivacySuccess('')
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setSavingInfo(true)
    setProfileError('')
    setProfileSuccess('')

    try {
      const payload = await apiRequest('/profile', {
        method: 'PATCH',
        token,
        body: profileValues,
      })

      onUserUpdate(payload.user)
      setProfileSuccess(payload.message)
    } catch (error) {
      setProfileError(error.payload?.message ?? 'Failed to update profile information.')
    } finally {
      setSavingInfo(false)
    }
  }

  const handlePhotoPick = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('profile_image', file)

    setSavingPhoto(true)
    setPhotoError('')
    setPhotoSuccess('')

    try {
      const payload = await apiRequest('/profile/photo', {
        method: 'POST',
        token,
        body: formData,
      })

      onUserUpdate(payload.user)
      setPhotoSuccess(payload.message)
    } catch (error) {
      setPhotoError(error.payload?.errors?.profile_image?.[0] ?? error.payload?.message ?? 'Failed to update profile image.')
    } finally {
      setSavingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setSavingPhoto(true)
    setPhotoError('')
    setPhotoSuccess('')

    try {
      const payload = await apiRequest('/profile/photo', {
        method: 'DELETE',
        token,
      })

      onUserUpdate(payload.user)
      setPhotoSuccess(payload.message)
    } catch (error) {
      setPhotoError(error.payload?.message ?? 'Failed to remove profile image.')
    } finally {
      setSavingPhoto(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setSavingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      const payload = await apiRequest('/profile/password', {
        method: 'PATCH',
        token,
        body: passwordValues,
      })

      setPasswordSuccess(payload.message)
      setPasswordValues({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (error) {
      const errors = error.payload?.errors ?? {}
      setPasswordError(
        errors.current_password?.[0]
          ?? errors.password?.[0]
          ?? error.payload?.message
          ?? 'Failed to update password.',
      )
    } finally {
      setSavingPassword(false)
    }
  }

  const handlePrivacySubmit = async (event) => {
    event.preventDefault()
    setSavingPrivacy(true)
    setPrivacyError('')
    setPrivacySuccess('')

    try {
      const payload = await apiRequest('/profile/privacy', {
        method: 'PATCH',
        token,
        body: privacyValues,
      })

      onUserUpdate(payload.user)
      setPrivacySuccess(payload.message)
    } catch (error) {
      const errors = error.payload?.errors ?? {}
      setPrivacyError(
        errors.public_location?.[0]
          ?? error.payload?.message
          ?? 'Failed to update public profile privacy.',
      )
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleRatingSuccess = (payload) => {
    setPendingRatings((current) => current.filter((item) => item.claim_id !== payload.rating?.claim_id))
  }

  return (
    <DashboardPageShell>
      <div className="profile-settings-grid">
        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Profile Photo</h2>
            <p>Upload or change your profile image.</p>
          </div>
          <div className="profile-photo-panel">
            <div className="profile-photo-large">
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt={user.name} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="profile-photo-actions">
              <input
                ref={photoInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                hidden
                onChange={handlePhotoPick}
              />
              <button
                type="button"
                className="quick-action-button"
                onClick={() => photoInputRef.current?.click()}
                disabled={savingPhoto}
              >
                {savingPhoto ? 'Saving...' : 'Upload / Change Image'}
              </button>
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleRemovePhoto}
                disabled={savingPhoto || !user.profile_image_url}
              >
                Remove Image
              </button>
            </div>
          </div>
          {photoError ? <p className="settings-feedback is-error">{photoError}</p> : null}
          {photoSuccess ? <p className="settings-feedback is-success">{photoSuccess}</p> : null}
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Personal Information</h2>
            <p>Review and update your account details.</p>
          </div>
          <form className="profile-form" onSubmit={handleSaveProfile}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Name</span>
                <input
                  name="name"
                  value={profileValues.name}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={profileValues.email}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>Phone</span>
                <input
                  name="phone"
                  value={profileValues.phone}
                  onChange={handleProfileChange}
                />
              </label>
              <label className="profile-form-field">
                <span>NRC Number</span>
                <input
                  name="nrc_no"
                  value={profileValues.nrc_no}
                  onChange={handleProfileChange}
                />
              </label>
            </div>

            {profileError ? <p className="settings-feedback is-error">{profileError}</p> : null}
            {profileSuccess ? <p className="settings-feedback is-success">{profileSuccess}</p> : null}

            <div className="profile-form-actions">
              <button type="submit" className="quick-action-button" disabled={savingInfo}>
                {savingInfo ? 'Saving...' : 'Save Information'}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>NRC Photos</h2>
            <p>Your registered identity photos for account verification.</p>
          </div>
          <div className="nrc-photo-grid">
            <div className="nrc-photo-card">
              <strong>NRC Front</strong>
              {user.nrc_front_photo_url ? (
                <img src={user.nrc_front_photo_url} alt="NRC front" className="nrc-photo-image" />
              ) : (
                <div className="nrc-photo-empty">No front photo uploaded.</div>
              )}
            </div>
            <div className="nrc-photo-card">
              <strong>NRC Back</strong>
              {user.nrc_back_photo_url ? (
                <img src={user.nrc_back_photo_url} alt="NRC back" className="nrc-photo-image" />
              ) : (
                <div className="nrc-photo-empty">No back photo uploaded.</div>
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Public Profile & Privacy</h2>
            <p>Control what other FindIt members can see.</p>
          </div>
          <form className="profile-form" onSubmit={handlePrivacySubmit}>
            <div className="privacy-toggle-list">
              <button
                type="button"
                className={`privacy-toggle-row${privacyValues.show_phone_publicly ? ' is-enabled' : ''}`}
                onClick={() => handlePrivacyToggle('show_phone_publicly')}
              >
                <span>
                  <strong>Public Phone</strong>
                  <small>{privacyValues.show_phone_publicly ? 'Visible on your public profile' : 'Hidden from other members'}</small>
                </span>
                <span className="privacy-switch" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`privacy-toggle-row${privacyValues.show_email_publicly ? ' is-enabled' : ''}`}
                onClick={() => handlePrivacyToggle('show_email_publicly')}
              >
                <span>
                  <strong>Public Email</strong>
                  <small>{privacyValues.show_email_publicly ? 'Visible on your public profile' : 'Hidden from other members'}</small>
                </span>
                <span className="privacy-switch" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`privacy-toggle-row${privacyValues.show_location_publicly ? ' is-enabled' : ''}`}
                onClick={() => handlePrivacyToggle('show_location_publicly')}
              >
                <span>
                  <strong>Public Area</strong>
                  <small>{privacyValues.show_location_publicly ? 'General area can be shown' : 'Area hidden from other members'}</small>
                </span>
                <span className="privacy-switch" aria-hidden="true" />
              </button>
            </div>

            <label className="profile-form-field">
              <span>General Area</span>
              <input
                value={privacyValues.public_location}
                onChange={handlePrivacyLocationChange}
                placeholder="Chanmyathazi, Mandalay"
                disabled={!privacyValues.show_location_publicly}
              />
            </label>

            {privacyError ? <p className="settings-feedback is-error">{privacyError}</p> : null}
            {privacySuccess ? <p className="settings-feedback is-success">{privacySuccess}</p> : null}

            <div className="profile-form-actions profile-privacy-actions">
              <button type="submit" className="quick-action-button" disabled={savingPrivacy}>
                {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
              </button>
              <button type="button" className="secondary-action-button" onClick={() => navigate(`/users/${user.id}`)}>
                View My Public Profile
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Reviews About Me</h2>
            <p>Feedback other members shared after completed returns.</p>
          </div>
          {loadingRatings ? (
            <p className="settings-note">Loading reviews...</p>
          ) : ratingsError ? (
            <p className="settings-feedback is-error">{ratingsError}</p>
          ) : (
            <>
              <div className="profile-rating-summary-row">
                <RatingSummary summary={ratingsPayload.rating_summary} />
              </div>
              <ReviewList reviews={ratingsPayload.recent_reviews} />
            </>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Reviews to Give</h2>
            <p>Rate completed returns while the experience is still fresh.</p>
          </div>
          {loadingPendingRatings ? (
            <p className="settings-note">Loading pending reviews...</p>
          ) : pendingRatingsError ? (
            <p className="settings-feedback is-error">{pendingRatingsError}</p>
          ) : pendingRatings.length > 0 ? (
            <div className="reviews-to-give-list">
              {pendingRatings.map((pendingRating) => (
                <article className="review-to-give-card" key={pendingRating.claim_id}>
                  <div>
                    <span className={`badge badge-${pendingRating.item?.post_type || 'community'}`}>
                      {pendingRating.item?.post_type || 'return'}
                    </span>
                    <h3>{pendingRating.item?.title || 'Returned item'}</h3>
                    <p>
                      Rate {pendingRating.reviewed_user?.name || 'this member'}
                      {pendingRating.returned_at ? ` • Returned ${formatDate(pendingRating.returned_at)}` : ''}
                    </p>
                    <small>{pendingRating.item?.category?.name || 'General'}</small>
                  </div>
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() => setRatingClaim({ id: pendingRating.claim_id })}
                  >
                    Rate User
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <p className="settings-note">No completed returns are waiting for your review.</p>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Security / Change Password</h2>
            <p>Keep your FindIt account secure.</p>
          </div>
          <form className="profile-form" onSubmit={handlePasswordSubmit}>
            <div className="profile-form-grid">
              <label className="profile-form-field">
                <span>Old Password</span>
                <div className="profile-password-shell">
                  <input
                    name="current_password"
                    type={showPasswords.current_password ? 'text' : 'password'}
                    value={passwordValues.current_password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        current_password: !current.current_password,
                      }))}
                  >
                    <Icon name={showPasswords.current_password ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
              <label className="profile-form-field">
                <span>New Password</span>
                <div className="profile-password-shell">
                  <input
                    name="password"
                    type={showPasswords.password ? 'text' : 'password'}
                    value={passwordValues.password}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        password: !current.password,
                      }))}
                  >
                    <Icon name={showPasswords.password ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
              <label className="profile-form-field">
                <span>Confirm New Password</span>
                <div className="profile-password-shell">
                  <input
                    name="password_confirmation"
                    type={showPasswords.password_confirmation ? 'text' : 'password'}
                    value={passwordValues.password_confirmation}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="profile-password-toggle"
                    onClick={() =>
                      setShowPasswords((current) => ({
                        ...current,
                        password_confirmation: !current.password_confirmation,
                      }))}
                  >
                    <Icon name={showPasswords.password_confirmation ? 'eyeOff' : 'eye'} />
                  </button>
                </div>
              </label>
            </div>

            {passwordError ? <p className="settings-feedback is-error">{passwordError}</p> : null}
            {passwordSuccess ? <p className="settings-feedback is-success">{passwordSuccess}</p> : null}

            <div className="profile-form-actions">
              <button type="submit" className="quick-action-button" disabled={savingPassword}>
                {savingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="section-panel-heading">
            <h2>Account Status</h2>
            <p>Your current account access status.</p>
          </div>
          <div className="status-chip">Active User Account</div>
          <span className={`profile-presence-label${presenceStatus.online ? ' is-online' : ''}`}>
            <i aria-hidden="true" />
            {presenceStatus.label}
          </span>
        </section>
      </div>
      <RatingModal
        open={Boolean(ratingClaim)}
        claim={ratingClaim}
        token={token}
        onClose={() => setRatingClaim(null)}
        onSuccess={handleRatingSuccess}
      />
    </DashboardPageShell>
  )
}

export default ProfilePage
