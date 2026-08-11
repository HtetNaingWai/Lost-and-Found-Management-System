import GuestNav from '../components/GuestNav'
import { heroImage } from '../utils/constants'
import Icon from '../components/Icon'
import Footer from '../components/Footer'

const stats = [
  ['10+', 'Lost Items Recovered', 'Successful returns handled through trusted reports.'],
  ['500+', 'Community Members', 'Neighbors ready to help reconnect belongings.'],
  ['95%', 'Successful Connections', 'Clear messaging and claim review reduce friction.'],
]

const workflowSteps = [
  ['Report an Item', 'Create a lost or found report with photos, location, category, and date.', 'document'],
  ['Search & Match', 'Browse approved posts and map pins to spot likely matches nearby.', 'search'],
  ['Verify Ownership', 'Use claim details and secure messaging to confirm the right owner.', 'shield'],
  ['Return Successfully', 'Complete the return and keep the community recovery trail clear.', 'checkCircle'],
]

const featureCards = [
  ['Lost Item Reporting', 'Publish clear missing-item reports for community visibility.', 'search'],
  ['Found Item Reporting', 'Log discovered belongings so owners can quickly identify them.', 'inventory'],
  ['Interactive Map', 'See location pins and neighborhood search areas at a glance.', 'pin'],
  ['Claim Verification', 'Review proof and claim status before a return is completed.', 'clipboard'],
  ['Secure Messaging', 'Coordinate safely without exposing private details publicly.', 'chat'],
  ['Community Support', 'Contact FindIt support for moderation, claims, and account help.', 'mail'],
]

function LandingPage({ onOpenModal }) {
  const handleContactSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <div className="landing-page">
      <GuestNav onOpenModal={onOpenModal} />

      <main>
        <section className="landing-hero-section" id="home">
          <div className="container landing-hero-grid">
            <div className="landing-hero-copy landing-reveal">
              <span className="landing-eyebrow">
                <Icon name="shield" />
                Trusted Lost &amp; Found Recovery
              </span>
              <h1>Lost Something? Find It. Return It. Connect.</h1>
              <p>
                FindIt helps communities report lost items, discover found belongings,
                and reconnect people with what matters.
              </p>
              <div className="landing-hero-actions">
                <button
                  type="button"
                  className="button button-primary landing-primary-cta"
                  onClick={() => onOpenModal('register')}
                >
                  <Icon name="plusCircle" />
                  <span>Report Lost Item</span>
                </button>
                <button
                  type="button"
                  className="button button-outline landing-secondary-cta"
                  onClick={() => onOpenModal('login')}
                >
                  <Icon name="search" />
                  <span>Browse Found Items</span>
                </button>
              </div>
              <div className="landing-trust-row" aria-label="Platform highlights">
                <span><Icon name="lock" /> Secure accounts</span>
                <span><Icon name="pin" /> Map discovery</span>
                <span><Icon name="chat" /> Safe messaging</span>
              </div>
            </div>

            <div className="landing-product-showcase landing-reveal" aria-label="FindIt dashboard preview">
              <div className="showcase-browser">
                <div className="showcase-browser-bar">
                  <span />
                  <span />
                  <span />
                  <strong>FindIt Live Recovery Board</strong>
                </div>
                <div className="showcase-content">
                  <div className="showcase-map">
                    <img src={heroImage} alt="Community place used as a map preview" />
                    <span className="map-pin pin-one"><Icon name="pin" /></span>
                    <span className="map-pin pin-two"><Icon name="pin" /></span>
                    <span className="map-pin pin-three"><Icon name="pin" /></span>
                    <div className="map-search-preview">
                      <Icon name="search" />
                      <span>Search township locations</span>
                    </div>
                  </div>
                  <div className="showcase-panel">
                    <span className="showcase-chip">Live Match</span>
                    <h2>Black wallet near Market Street</h2>
                    <p>2 possible matches found within 1.4 km</p>
                    <div className="showcase-progress">
                      <span />
                    </div>
                  </div>
                  <div className="showcase-list">
                    {[
                      ['Found', 'Silver phone', 'Community Park'],
                      ['Lost', 'Blue backpack', 'Bus Stop 4'],
                      ['Claim', 'House keys', 'Verifying'],
                    ].map(([type, title, meta]) => (
                      <article key={title}>
                        <span>{type}</span>
                        <strong>{title}</strong>
                        <small>{meta}</small>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats-section">
          <div className="container landing-stats-grid">
            {stats.map(([value, label, detail]) => (
              <article className="landing-stat-card landing-reveal" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-muted" id="lost-items">
          <div className="container landing-split-section">
            <div className="landing-section-copy landing-reveal">
              <span className="landing-eyebrow">Community Recovery</span>
              <h2>Built for trusted neighborhood returns.</h2>
              <p>
                FindIt combines moderated reporting, public discovery, secure claims,
                and direct messaging so every lost or found item has a clear path home.
              </p>
            </div>
            <div className="landing-recovery-card landing-reveal">
              <div>
                <Icon name="search" />
                <strong>Lost item reported</strong>
                <span>Photo, category, location, and date captured.</span>
              </div>
              <div>
                <Icon name="shield" />
                <strong>Admin reviewed</strong>
                <span>Unsafe or duplicate posts stay out of public listings.</span>
              </div>
              <div>
                <Icon name="chat" />
                <strong>Owner connected</strong>
                <span>Messages and claims keep the return process accountable.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="container">
            <div className="landing-section-heading landing-reveal">
              <h2>How It Works</h2>
              <p>A simple workflow for reporting, matching, verifying, and returning belongings.</p>
            </div>

            <div className="landing-steps-grid">
              {workflowSteps.map(([title, description, icon], index) => (
                <article className="landing-step-card landing-reveal" key={title}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div className="landing-card-icon"><Icon name={icon} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-muted" id="found-items">
          <div className="container">
            <div className="landing-section-heading landing-reveal">
              <h2>Everything a community needs to recover items.</h2>
              <p>Modern tools for reports, maps, claims, messaging, and support.</p>
            </div>

            <div className="landing-features-grid">
              {featureCards.map(([title, description, icon]) => (
                <article className="landing-feature-card landing-reveal" key={title}>
                  <div className="landing-card-icon"><Icon name={icon} /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-map-section" id="messages">
          <div className="container landing-map-grid">
            <div className="landing-map-preview landing-reveal" aria-label="Lost item map preview">
              <div className="landing-map-search">
                <Icon name="search" />
                <span>Find lost items around your community</span>
              </div>
              <div className="landing-map-canvas">
                <span className="map-road road-one" />
                <span className="map-road road-two" />
                <span className="map-road road-three" />
                <span className="map-pin map-a"><Icon name="pin" /></span>
                <span className="map-pin map-b"><Icon name="pin" /></span>
                <span className="map-pin map-c"><Icon name="pin" /></span>
                <article>
                  <strong>Found: Keys</strong>
                  <small>0.8 km away</small>
                </article>
              </div>
            </div>
            <div className="landing-section-copy landing-reveal">
              <span className="landing-eyebrow">Interactive Map</span>
              <h2>See nearby reports before the trail goes cold.</h2>
              <p>
                Location-aware discovery helps people search by neighborhood,
                landmark, and item type, while built-in messaging keeps next steps safe.
              </p>
              <button type="button" className="button button-primary" onClick={() => onOpenModal('login')}>
                <Icon name="pin" />
                <span>Explore the Map</span>
              </button>
            </div>
          </div>
        </section>

        <section className="landing-contact-section" id="contact">
          <div className="container landing-contact-grid">
            <div className="landing-contact-info landing-reveal">
              <span className="landing-eyebrow">Contact Support</span>
              <h2>Need help with a report, claim, or return?</h2>
              <p>Send the FindIt support team the details and we will help keep the recovery process clear.</p>
              <div className="landing-contact-list">
                <span><Icon name="mail" /> support@findit.local</span>
                <span><Icon name="phone" /> +95 9 123 456 789</span>
                <span><Icon name="pin" /> Community Support Center</span>
                <span><Icon name="shield" /> Moderation and claim assistance</span>
              </div>
            </div>
            <form className="landing-contact-form landing-reveal" onSubmit={handleContactSubmit}>
              <label>
                <span>Name</span>
                <input type="text" name="name" placeholder="Your name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" name="email" placeholder="you@example.com" />
              </label>
              <label>
                <span>Subject</span>
                <input type="text" name="subject" placeholder="How can we help?" />
              </label>
              <label>
                <span>Message</span>
                <textarea name="message" rows="5" placeholder="Tell us about your item, claim, or account question." />
              </label>
              <button type="submit" className="button button-primary">
                <Icon name="send" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
