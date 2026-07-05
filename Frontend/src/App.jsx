import { useEffect, useRef, useState } from 'react'
import './App.css'
import heroImage from './assets/landing_hero.jpg'

const howItWorksSteps = [
  {
    title: '1. Create an Account',
    description:
      'Register as a resident and log in securely to access the platform.',
    icon: 'personAdd',
  },
  {
    title: '2. Submit Item Details',
    description:
      'Logged-in users can report lost or found items with clear descriptions and images.',
    icon: 'document',
  },
  {
    title: '3. Admin Approval',
    description:
      'Submissions are reviewed by community admins before becoming visible to ensure security.',
    icon: 'shield',
  },
]

const platformFeatures = [
  ['Secure Login', 'Protected access for verified residents.', 'lock'],
  ['Admin Approval', 'Moderated listings maintain quality and trust.', 'shield'],
  ['Lost Item Reporting', 'Easily alert the community about missing items.', 'search'],
  ['Found Item Reporting', "Log items you've discovered to help neighbors.", 'inventory'],
  ['Claim Request System', 'Structured process to claim ownership securely.', 'clipboard'],
  ['Community Recovery', 'Fostering a helpful and connected township.', 'group'],
]

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 2 * 1024 * 1024

const initialRegisterValues = {
  fullName: '',
  email: '',
  phone: '',
  nrcNumber: '',
  password: '',
  confirmPassword: '',
}

function Icon({ name }) {
  const paths = {
    search:
      'M10 4a6 6 0 1 0 3.87 10.58l4.77 4.77 1.41-1.41-4.77-4.77A6 6 0 0 0 10 4Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z',
    plus:
      'M12 5a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H6a1 1 0 1 1 0-2h5V6a1 1 0 0 1 1-1Z',
    personAdd:
      'M12 12.75a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.75Zm0-6.5a2.25 2.25 0 1 1-2.25 2.25A2.25 2.25 0 0 1 12 6.25ZM12 14.5c-4.42 0-8 2.09-8 4.67a1 1 0 1 0 2 0c0-1.07 2.35-2.67 6-2.67s6 1.6 6 2.67a1 1 0 1 0 2 0c0-2.58-3.58-4.67-8-4.67Zm8.5-2.5h-1.75v-1.75a1 1 0 1 0-2 0V12H15a1 1 0 1 0 0 2h1.75v1.75a1 1 0 1 0 2 0V14h1.75a1 1 0 1 0 0-2Z',
    document:
      'M15 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Zm0 2.5L16.5 6H15ZM17 20H7V4h6v4h4ZM9 11h6a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2Zm0 4h6a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2Zm0 4h4a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2Z',
    shield:
      'M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5Zm0 18.9c-3.17-1.11-6-5.52-6-9.9V6.44l6-2.25 6 2.25V11c0 4.38-2.83 8.79-6 9.9Zm-1.18-5.49-2.12-2.12-1.41 1.41 3.53 3.54 5.89-5.89-1.41-1.41Z',
    lock:
      'M17 8h-1V6a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm7 13H7v-9h10Z',
    inventory:
      'M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.83a2 2 0 0 0-.59-1.41l-2.83-2.83A2 2 0 0 0 14.17 3Zm0 2h7v3h3v11H7Zm2 6v2h6v-2Zm0 4v2h6v-2Z',
    clipboard:
      'M19 3h-3.18A3 3 0 0 0 13 1h-2a3 3 0 0 0-2.82 2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-8-1h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2Zm8 17H5V5h2v2h10V5h2Zm-8.41-4.59-2.3-2.29-1.41 1.41 3.71 3.71 6-6-1.41-1.41Z',
    group:
      'M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C23 14.17 18.33 13 16 13Zm-8 0c-.29 0-.62.02-.97.05A4.73 4.73 0 0 1 9 16.5V19H1v-2.5C1 14.17 5.67 13 8 13Zm4-1a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z',
    community:
      'M19 9h-3.17A3 3 0 0 0 13 7h-2a3 3 0 0 0-2.83 2H5a2 2 0 0 0-2 2v7h2v-7h3.17A3 3 0 0 0 11 13h2a3 3 0 0 0 2.83-2H19v7h2v-7a2 2 0 0 0-2-2ZM11 11a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2Zm-7.41 8.41 1.41-1.41L8 21l3-3-1.41-1.41L8 18.17Zm16.82 0L16 18.17l-1.59 1.58L16 21l4.41-4.41Z',
    mail:
      'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Zm2.2-.5 5.8 4.78L17.8 6Zm11.8 1.3-5.36 4.42a1 1 0 0 1-1.28 0L6 7.3v10.2a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5Z',
    eye:
      'M12 5c5.23 0 9.27 4.57 9.44 4.76a1 1 0 0 1 0 1.48C21.27 11.43 17.23 16 12 16s-9.27-4.57-9.44-4.76a1 1 0 0 1 0-1.48C2.73 9.57 6.77 5 12 5Zm0 9c3.57 0 6.66-2.73 7.79-4-1.13-1.27-4.22-4-7.79-4S5.34 8.73 4.21 10c1.13 1.27 4.22 4 7.79 4Zm0-6.5A2.5 2.5 0 1 1 9.5 10 2.5 2.5 0 0 1 12 7.5Z',
    eyeOff:
      'm4.71 3.29-1.42 1.42 2.07 2.07A12.33 12.33 0 0 0 2.56 9.76a1 1 0 0 0 0 1.48C2.73 11.43 6.77 16 12 16a9.9 9.9 0 0 0 3.88-.76l3.41 3.41 1.42-1.42ZM12 14c-3.57 0-6.66-2.73-7.79-4a14 14 0 0 1 2.58-2.21l1.56 1.56A2.49 2.49 0 0 0 12 12.5a2.47 2.47 0 0 0 1.65-.62l1.44 1.44A7.55 7.55 0 0 1 12 14Zm0-9a9.84 9.84 0 0 1 9.44 4.76 1 1 0 0 1 0 1.48 15.08 15.08 0 0 1-3.6 2.94l-1.46-1.46A7.9 7.9 0 0 0 19.79 10C18.66 8.73 15.57 6 12 6a7.49 7.49 0 0 0-2.25.34L8.17 4.76A10.67 10.67 0 0 1 12 5Z',
    phone:
      'M6.62 10.79a15.46 15.46 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.24A11.36 11.36 0 0 0 20 15.5a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .56 3.59 1 1 0 0 1-.24 1Z',
    idCard:
      'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Zm6 2.25A2.25 2.25 0 1 0 12.25 11 2.25 2.25 0 0 0 10 8.75ZM8 16h8a3.38 3.38 0 0 0-3.38-2.75h-1.24A3.38 3.38 0 0 0 8 16Zm8-7h2V7h-2Zm0 4h2v-2h-2Z',
    upload:
      'M12 3a1 1 0 0 1 1 1v7.59l2.3-2.29 1.4 1.41-4.7 4.7-4.7-4.7 1.4-1.41 2.3 2.29V4a1 1 0 0 1 1-1Zm-7 14h14v2H5Z',
    arrowLeft:
      'M10.71 5.29 4 12l6.71 6.71 1.41-1.41L7.83 13H20v-2H7.83l4.29-4.29Z',
    user:
      'M12 12.75a4.25 4.25 0 1 0-4.25-4.25A4.25 4.25 0 0 0 12 12.75Zm0-6.5a2.25 2.25 0 1 1-2.25 2.25A2.25 2.25 0 0 1 12 6.25ZM12 14.5c-4.42 0-8 2.09-8 4.67a1 1 0 1 0 2 0c0-1.07 2.35-2.67 6-2.67s6 1.6 6 2.67a1 1 0 1 0 2 0c0-2.58-3.58-4.67-8-4.67Z',
    close:
      'M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.29-6.3Z',
    home:
      'M12 3.4 3 10.6V20h6v-5h6v5h6v-9.4Zm7 14.6h-2v-5h-10v5H5v-6.46l7-5.6 7 5.6Z',
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

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

function GuestNav({ onOpenModal }) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <a className="brand" href="#home">
          <BrandMark />
          <span>FindIt</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a className="is-active" href="#home">
            Home
          </a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact Us</a>
        </nav>
      </div>
    </header>
  )
}

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
        <span>FindIt</span>
      </div>
      <div className="auth-heading">
        <h1 id="auth-modal-title">{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function LoginModal({ onClose, onSwitch }) {
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handleSubmit = (event) => {
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

        <button type="submit" className="auth-submit">
          Login
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

function RegisterModal({ onClose, onSwitch }) {
  const [values, setValues] = useState(initialRegisterValues)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [frontPhoto, setFrontPhoto] = useState({ file: null, preview: '' })
  const [backPhoto, setBackPhoto] = useState({ file: null, preview: '' })

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
  }

  const updateUpload = (setter, errorKey, file) => {
    setErrors((current) => ({ ...current, [errorKey]: '' }))

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

  const handleSubmit = (event) => {
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
            icon="user"
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

        <button type="submit" className="auth-submit">
          Register
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

function AuthModal({ authModal, setAuthModal }) {
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
          />
        ) : (
          <RegisterModal
            onClose={() => setAuthModal(null)}
            onSwitch={(mode) => setAuthModal(mode)}
          />
        )}
      </div>
    </div>
  )
}

function App() {
  const [authModal, setAuthModal] = useState(null)

  return (
    <>
      <div className={`page-shell${authModal ? ' is-modal-open' : ''}`}>
        <div className="page-blur-layer">
          <div className="landing-page">
            <GuestNav onOpenModal={setAuthModal} />

            <main>
              <section className="hero-section" id="home">
                <div className="hero-media">
                  <img src={heroImage} alt="" />
                </div>
                <div className="hero-overlay" />

                <div className="container hero-content">
                  <div className="hero-card">
                    <h1>FindIt</h1>
                    <p>
                      A community-based lost and found platform that helps people
                      report lost items, submit found items, and reconnect
                      belongings with their rightful owners.
                    </p>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="button button-outline-dark"
                        onClick={() => setAuthModal('login')}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => setAuthModal('register')}
                      >
                        Register
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="section section-muted" id="about">
                <div className="container">
                  <div className="info-card">
                    <div className="info-copy">
                      <h2>Community Focused Recovery</h2>
                      <p>
                        FindIt is designed to help our township residents safely
                        and efficiently manage lost and found items. We believe in
                        the power of community trust. By facilitating a secure
                        approval process, we ensure that every reported item is
                        handled with care, reconnecting neighbors with their valued
                        possessions while maintaining a dependable civic
                        environment.
                      </p>
                    </div>

                    <div className="info-emblem" aria-hidden="true">
                      <Icon name="community" />
                    </div>
                  </div>
                </div>
              </section>

              <section className="section section-light">
                <div className="container">
                  <div className="section-heading">
                    <h2>How It Works</h2>
                    <p>
                      Three simple steps to manage lost and found items in our
                      community.
                    </p>
                  </div>

                  <div className="steps-grid">
                    {howItWorksSteps.map((step) => (
                      <article className="step-card" key={step.title}>
                        <div className="step-icon">
                          <Icon name={step.icon} />
                        </div>
                        <h3>{step.title}</h3>
                        <p>{step.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="section section-muted">
                <div className="container">
                  <div className="section-heading">
                    <h2>Platform Features</h2>
                    <p>Tools designed for community recovery.</p>
                  </div>

                  <div className="features-grid">
                    {platformFeatures.map(([title, description, icon]) => (
                      <article className="feature-card" key={title}>
                        <div className="feature-icon">
                          <Icon name={icon} />
                        </div>
                        <div>
                          <h3>{title}</h3>
                          <p>{description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>

              <section className="cta-band" id="contact">
                <div className="container cta-inner">
                  <h2>Lost something or found something?</h2>
                  <p>
                    Create an account today to help keep our community connected
                    and ensure belongings find their way home.
                  </p>
                  <div className="cta-actions">
                    <button
                      type="button"
                      className="button button-soft button-large"
                      onClick={() => setAuthModal('register')}
                    >
                      Register Now
                    </button>
                    <button
                      type="button"
                      className="button button-outline button-large"
                      onClick={() => setAuthModal('login')}
                    >
                      Login
                    </button>
                  </div>
                </div>
              </section>
            </main>

            <footer className="site-footer">
              <div className="container footer-inner">
                <a className="brand brand-footer" href="#home">
                  <BrandMark />
                  <span>FindIt</span>
                </a>

                <nav className="footer-links" aria-label="Footer">
                  <a href="#about">About Us</a>
                  <a href="#contact">Contact Us</a>
                  <a href="#privacy">Privacy Policy</a>
                  <a href="#terms">Terms of Service</a>
                </nav>

                <p className="footer-copy">@2026 FindIt. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <AuthModal authModal={authModal} setAuthModal={setAuthModal} />
    </>
  )
}

export default App
