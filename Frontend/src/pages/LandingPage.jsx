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
              <h1>FindIt</h1>
              <p>
                A community-based lost and found platform that helps people
                report lost items, submit found items, and reconnect belongings
                with their rightful owners.
              </p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => onOpenModal('register')}
                >
                  Register
                </button>
                <button
                  type="button"
                  className="button button-outline-dark"
                  onClick={() => onOpenModal('login')}
                >
                  Login
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
                  FindIt is designed to help our township residents safely and
                  efficiently manage lost and found items. We believe in the
                  power of community trust. By facilitating a secure approval
                  process, we ensure that every reported item is handled with
                  care, reconnecting neighbors with their valued possessions
                  while maintaining a dependable civic environment.
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
              Create an account today to help keep our community connected and
              ensure belongings find their way home.
            </p>
            <div className="cta-actions">
              <button
                type="button"
                className="button button-soft button-large"
                onClick={() => onOpenModal('register')}
              >
                Register Now
              </button>
              <button
                type="button"
                className="button button-outline button-large"
                onClick={() => onOpenModal('login')}
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

          <p className="footer-copy">© 2024 FindIt. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
