import { useEffect, useRef, useState } from 'react'
import {
  ACCEPTED_FILE_TYPES,
  initialRegisterValues,
  MAX_FILE_SIZE,
} from '../utils/constants'
import { apiRequest } from '../services/api'
import BrandMark from './BrandMark'
import Icon from './Icon'

function AuthField({
  label,
  name,
  type = 'text',
  icon,
  value,
  onChange,
  error,
  showToggle,
  passwordVisible,
  onTogglePassword,
}) {
  return (
    <label className="auth-field">
      <span className="auth-label">{label}</span>
      <span className={`auth-input-shell${error ? ' has-error' : ''}`}>
        <span className="auth-input-icon">
          <Icon name={icon} />
        </span>
        <input name={name} type={type} value={value} onChange={onChange} />
        {showToggle ? (
          <button
            type="button"
            className="password-toggle"
            onClick={onTogglePassword}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
          >
            <Icon name={passwordVisible ? 'eyeOff' : 'eye'} />
          </button>
        ) : null}
      </span>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  )
}

function UploadBox({ label, fileState, error, onPick, onDropFile, onRemove }) {
  const inputRef = useRef(null)

  const openPicker = () => {
    inputRef.current?.click()
  }

  const handleInputChange = (event) => {
    onPick(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      onDropFile(file)
    }
  }

  return (
    <div className="upload-field">
      <span className="auth-label">{label}</span>
      <div
        className={`upload-box${fileState.preview ? ' has-file' : ''}${error ? ' has-error' : ''}`}
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openPicker()
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleInputChange}
          hidden
        />

        {fileState.preview ? (
          <div className="upload-preview">
            <img src={fileState.preview} alt={`${label} preview`} />
            <div className="upload-preview-meta">
              <strong>{fileState.file?.name}</strong>
              <span>{Math.round((fileState.file?.size ?? 0) / 1024)} KB</span>
              <button
                type="button"
                className="upload-remove"
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove()
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
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}

function ModalFrame({ title, subtitle, onClose, children }) {
  return (
    <section
      className="auth-modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="auth-modal-top">
        <button type="button" className="back-home-button" onClick={onClose}>
          <span className="back-home-icon">
            <Icon name="home" />
          </span>
          <span>Back to Home</span>
        </button>

        <button type="button" className="modal-close-button" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>

      <div className="auth-brand">
        <BrandMark />
        <span className="brand-copy">
          <strong>FindIt</strong>
          <small>Lost &amp; Found</small>
        </span>
      </div>
      <div className="auth-heading">
        <h1 id="auth-modal-title">{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function LoginModal({ onClose, onSwitch, onAuthSuccess }) {
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError('')

    try {
      const payload = await apiRequest('/login', {
        method: 'POST',
        body: values,
      })

      onAuthSuccess(payload)
    } catch (error) {
      setFormError(error.payload?.message ?? 'Login failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalFrame
      title="Welcome Back"
      subtitle="Login to continue using FindIt."
      onClose={onClose}
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <AuthField
          label="Email"
          name="email"
          type="email"
          icon="mail"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <AuthField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          icon="lock"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
          showToggle
          passwordVisible={showPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
        />

        {formError ? <p className="form-error-banner">{formError}</p> : null}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Login'}
        </button>

        <p className="auth-switch">
          Don&apos;t have an account?{' '}
          <button type="button" onClick={() => onSwitch('register')}>
            Register
          </button>
        </p>
      </form>
    </ModalFrame>
  )
}

function RegisterModal({ onClose, onSwitch, onAuthSuccess }) {
  const [values, setValues] = useState(initialRegisterValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [frontPhoto, setFrontPhoto] = useState({ file: null, preview: '' })
  const [backPhoto, setBackPhoto] = useState({ file: null, preview: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    return () => {
      if (frontPhoto.preview) URL.revokeObjectURL(frontPhoto.preview)
      if (backPhoto.preview) URL.revokeObjectURL(backPhoto.preview)
    }
  }, [frontPhoto.preview, backPhoto.preview])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setFormError('')
  }

  const updateUpload = (setter, errorKey, file) => {
    setErrors((current) => ({ ...current, [errorKey]: '' }))
    setFormError('')

    if (!file) return

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        [errorKey]: 'Please upload a JPG, PNG, or WEBP image.',
      }))
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrors((current) => ({
        ...current,
        [errorKey]: 'Image must be 2MB or smaller.',
      }))
      return
    }

    setter((current) => {
      if (current.preview) URL.revokeObjectURL(current.preview)
      return { file, preview: URL.createObjectURL(file) }
    })
  }

  const clearUpload = (setter) => {
    setter((current) => {
      if (current.preview) URL.revokeObjectURL(current.preview)
      return { file: null, preview: '' }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!values.phone.trim()) nextErrors.phone = 'Phone number is required.'
    if (!values.nrcNumber.trim()) nextErrors.nrcNumber = 'NRC number is required.'
    if (!frontPhoto.file) nextErrors.frontPhoto = 'NRC front photo is required.'
    if (!backPhoto.file) nextErrors.backPhoto = 'NRC back photo is required.'

    if (!values.password.trim()) {
      nextErrors.password = 'Password is required.'
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.'
    }

    if (!values.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password.'
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setFormError('')

    const formData = new FormData()
    formData.append('name', values.fullName)
    formData.append('email', values.email)
    formData.append('phone', values.phone)
    formData.append('nrc_no', values.nrcNumber)
    formData.append('nrc_front_photo', frontPhoto.file)
    formData.append('nrc_back_photo', backPhoto.file)
    formData.append('password', values.password)
    formData.append('password_confirmation', values.confirmPassword)

    try {
      const payload = await apiRequest('/register', {
        method: 'POST',
        body: formData,
      })

      onAuthSuccess(payload)
    } catch (error) {
      const backendErrors = error.payload?.errors ?? {}
      setErrors({
        fullName: backendErrors.name?.[0] ?? '',
        email: backendErrors.email?.[0] ?? '',
        phone: backendErrors.phone?.[0] ?? '',
        nrcNumber: backendErrors.nrc_no?.[0] ?? '',
        frontPhoto: backendErrors.nrc_front_photo?.[0] ?? '',
        backPhoto: backendErrors.nrc_back_photo?.[0] ?? '',
        password: backendErrors.password?.[0] ?? '',
        confirmPassword: '',
      })
      setFormError(error.payload?.message ?? 'Registration failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalFrame
      title="Create Account"
      subtitle="Register to report lost and found items in your community."
      onClose={onClose}
    >
      <form className="auth-form auth-form-register" onSubmit={handleSubmit} noValidate>
        <div className="register-grid">
          <AuthField
            label="Full Name"
            name="fullName"
            icon="userCircle"
            value={values.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />
          <AuthField
            label="Email"
            name="email"
            type="email"
            icon="mail"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <AuthField
            label="Phone Number"
            name="phone"
            type="tel"
            icon="phone"
            value={values.phone}
            onChange={handleChange}
            error={errors.phone}
          />
          <AuthField
            label="NRC Number"
            name="nrcNumber"
            icon="idCard"
            value={values.nrcNumber}
            onChange={handleChange}
            error={errors.nrcNumber}
          />
        </div>

        <div className="upload-grid">
          <UploadBox
            label="NRC Photo Front"
            fileState={frontPhoto}
            error={errors.frontPhoto}
            onPick={(file) => updateUpload(setFrontPhoto, 'frontPhoto', file)}
            onDropFile={(file) => updateUpload(setFrontPhoto, 'frontPhoto', file)}
            onRemove={() => clearUpload(setFrontPhoto)}
          />
          <UploadBox
            label="NRC Photo Back"
            fileState={backPhoto}
            error={errors.backPhoto}
            onPick={(file) => updateUpload(setBackPhoto, 'backPhoto', file)}
            onDropFile={(file) => updateUpload(setBackPhoto, 'backPhoto', file)}
            onRemove={() => clearUpload(setBackPhoto)}
          />
        </div>

        <div className="register-grid">
          <AuthField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            icon="lock"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            showToggle
            passwordVisible={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
          />
          <AuthField
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            icon="lock"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            showToggle
            passwordVisible={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((current) => !current)}
          />
        </div>

        {formError ? <p className="form-error-banner">{formError}</p> : null}

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <button type="button" onClick={() => onSwitch('login')}>
            Login
          </button>
        </p>
      </form>
    </ModalFrame>
  )
}

function AuthModal({ authModal, setAuthModal, onAuthSuccess }) {
  useEffect(() => {
    if (!authModal) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAuthModal(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [authModal, setAuthModal])

  if (!authModal) return null

  return (
    <div className="auth-modal-root" onClick={() => setAuthModal(null)}>
      <div className="auth-modal-overlay" />
      <div className="auth-modal-shell">
        {authModal === 'login' ? (
          <LoginModal
            onClose={() => setAuthModal(null)}
            onSwitch={(mode) => setAuthModal(mode)}
            onAuthSuccess={onAuthSuccess}
          />
        ) : (
          <RegisterModal
            onClose={() => setAuthModal(null)}
            onSwitch={(mode) => setAuthModal(mode)}
            onAuthSuccess={onAuthSuccess}
          />
        )}
      </div>
    </div>
  )
}

export default AuthModal
