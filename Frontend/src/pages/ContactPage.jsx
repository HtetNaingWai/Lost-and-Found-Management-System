import { useState } from 'react'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import { apiRequest } from '../services/api'

function ContactForm({ user, token }) {
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    subject: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccess('')
  }

  const validate = () => {
    const nextErrors = {}

    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Enter a valid email address.'
    }
    if (!values.subject.trim()) nextErrors.subject = 'Subject is required.'
    if (!values.message.trim()) nextErrors.message = 'Message is required.'

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSuccess('')

    if (!validate()) return

    setSubmitting(true)

    try {
      const payload = await apiRequest('/contact-messages', {
        method: 'POST',
        token,
        body: {
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        },
      })

      setSuccess(payload.message ?? 'Your support message was submitted successfully.')
      setValues((current) => ({
        ...current,
        subject: '',
        message: '',
      }))
    } catch (error) {
      setErrors({
        form: error.payload?.message ?? 'Failed to submit your support message.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="contact-form-card">
      <div className="section-panel-heading">
        <h2>Send a Support Message</h2>
        <p>The admin team will receive your request in the Contact Messages inbox.</p>
      </div>

      <form className="profile-form contact-form" onSubmit={handleSubmit}>
        <div className="profile-form-grid">
          <label className="profile-form-field">
            <span>Name</span>
            <input name="name" value={values.name} onChange={handleChange} />
            {errors.name ? <small className="field-error">{errors.name}</small> : null}
          </label>

          <label className="profile-form-field">
            <span>Email</span>
            <input name="email" type="email" value={values.email} onChange={handleChange} />
            {errors.email ? <small className="field-error">{errors.email}</small> : null}
          </label>

          <label className="profile-form-field profile-form-field-full">
            <span>Subject</span>
            <input name="subject" value={values.subject} onChange={handleChange} />
            {errors.subject ? <small className="field-error">{errors.subject}</small> : null}
          </label>

          <label className="profile-form-field profile-form-field-full">
            <span>Message</span>
            <textarea
              name="message"
              rows="7"
              value={values.message}
              onChange={handleChange}
              placeholder="Describe what happened and include any item, claim, or account details that can help."
            />
            {errors.message ? <small className="field-error">{errors.message}</small> : null}
          </label>
        </div>

        {errors.form ? <p className="settings-feedback is-error">{errors.form}</p> : null}
        {success ? <p className="settings-feedback is-success">{success}</p> : null}

        <div className="profile-form-actions">
          <button type="submit" className="quick-action-button" disabled={submitting}>
            {submitting ? 'Sending...' : 'Submit Message'}
          </button>
        </div>
      </form>
    </section>
  )
}

function ContactPage({ user, token }) {
  return (
    <DashboardPageShell>
      <div className="contact-support-layout">
        <section className="contact-support-card">
          <span className="contact-support-icon">
            <Icon name="mail" />
          </span>
          <h2>Community Support</h2>
          <p>Use this channel for account issues, item reports, claims, and safety concerns.</p>
          <div className="contact-support-details">
            <div>
              <strong>Email</strong>
              <span>support@findit.local</span>
            </div>
            <div>
              <strong>Phone</strong>
              <span>+95 9 123 456 789</span>
            </div>
            <div>
              <strong>Office Hours</strong>
              <span>Mon to Fri, 9:00 AM to 5:00 PM</span>
            </div>
          </div>
        </section>

        <ContactForm user={user} token={token} />
      </div>
    </DashboardPageShell>
  )
}

export default ContactPage
