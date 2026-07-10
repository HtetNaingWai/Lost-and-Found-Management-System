import GuestNav from '../components/GuestNav'
import { heroImage, howItWorksSteps, platformFeatures } from '../utils/constants'
import Icon from '../components/Icon'
import BrandMark from '../components/BrandMark'

function LandingPage({ onOpenModal }) {
  return (
    <div className="landing-page">
      <GuestNav />

      <main>
        <section className="hero-section" id="home">
          <div className="hero-media">
            <img src={heroImage} alt="" />
          </div>
          <div className="hero-overlay" />

          <div className="container hero-content">
            <div className="hero-card">
              <p className="hero-eyebrow">
                <Icon name="shield" />
                <span>Trusted Community Recovery</span>
              </p>
              <h1>
                Lost Something?
                <span> We&apos;re Here to Help.</span>
              </h1>
              <p>
                Report lost items, track found belongings, and reconnect with your
                community safely.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => onOpenModal('register')}
                >
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  className="button button-outline-dark"
                  onClick={() => onOpenModal('login')}
                >
                  
                  <span>Login</span>
                </button>
              </div>
              <div className="hero-trust-points">
                <span><Icon name="shield" /> Secure reporting</span>
                <span><Icon name="community" /> Community visibility</span>
                <span><Icon name="inventory" /> Faster recovery</span>
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
                  FindIt is designed to help our township residents safely and
                  efficiently manage lost and found items. We believe in the
                  power of community trust. By facilitating a secure approval
                  process, we ensure that every reported item is handled with
                  care, reconnecting neighbors with their valued possessions
                  while maintaining a dependable civic environment.
                </p>
              </div>

              <div className="info-emblem" aria-hidden="true">
                <Icon name="search" />
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
              Create an account today to report, track, and recover belongings
              with confidence.
            </p>
            <div className="cta-actions">
              <button
                type="button"
                className="button button-soft button-large"
                onClick={() => onOpenModal('register')}
              >
                <span>Register</span>
              </button>
              <button
                type="button"
                className="button button-outline button-large"
                onClick={() => onOpenModal('login')}
              >
                <span>Login</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <a className="brand brand-footer" href="#home">
            <BrandMark />
            <span className="brand-copy">
              <strong>FindIt</strong>
              <small>Lost &amp; Found</small>
            </span>
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
  )
}

export default LandingPage
