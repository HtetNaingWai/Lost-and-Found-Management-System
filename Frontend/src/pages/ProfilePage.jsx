import { useEffect, useRef, useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import { apiRequest } from '../services/api'

function ProfilePage({ user, token, onUserUpdate }) {
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
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
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
  }, [user])

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
        </section>
      </div>
    </DashboardPageShell>
  )
}

export default ProfilePage
