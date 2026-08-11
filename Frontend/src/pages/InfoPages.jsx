import Icon from '../components/Icon'

const privacySections = [
  ['Information we collect', 'FindIt collects only the information needed to create accounts, submit lost/found reports, support claims, and keep the system useful.'],
  ['Account information', 'Your name, email, phone number, profile details, and login information help identify users and keep reports accountable.'],
  ['Lost/found item information', 'Item titles, descriptions, categories, photos, dates, and report status are used to describe lost or found belongings.'],
  ['Location data', 'When you select a map location, FindIt saves the readable location, latitude, and longitude so approved reports can appear on the map.'],
  ['How information is used', 'Information is used to show approved reports, support admin moderation, help users communicate, review claims, and complete returns.'],
  ['Who can see item information', 'Approved lost/found reports can be seen by users. Pending and rejected reports are handled through the review process and are not shown on the public map.'],
  ['Data protection', 'FindIt uses account access, admin review, and controlled pages to reduce misuse of submitted information.'],
  ['User responsibilities', 'Users should submit honest reports, avoid unnecessary personal details, and keep private information out of public item descriptions.'],
  ['Contact/support', 'Users can contact the FindIt support team through the Contact Us page for help with accounts, reports, claims, or safety concerns.'],
]

const securitySections = [
  ['Secure user accounts', 'Users sign in before submitting reports, messaging other members, or making claims.'],
  ['Admin moderation', 'Lost and found posts are reviewed before they become public, helping reduce spam, duplicate, or unsafe reports.'],
  ['Post workflow', 'Reports move through Pending, Approved, or Rejected states so users can understand review progress.'],
  ['Claim review', 'Claims are reviewed and verified before an item is treated as returned to the correct owner.'],
  ['Safe messaging', 'Users can communicate through FindIt messages instead of immediately sharing personal contact details.'],
  ['Sensitive information', 'Avoid publishing passwords, IDs, financial information, or highly sensitive personal details in item posts.'],
  ['Suspicious activity', 'Report suspicious users, fake claims, or unsafe behavior so admins can review it.'],
  ['Location safety', 'Use public landmarks when possible and avoid posting exact private or home addresses.'],
]

const workflowSteps = [
  ['Report', 'User submits a Lost or Found item with details, image, and map location.', 'document'],
  ['Review', 'The post is sent to the Admin as Pending.', 'clock'],
  ['Approval', 'Admin reviews and approves or rejects the submission.', 'shield'],
  ['Discover', 'Approved Lost/Found items appear in listings and on the interactive map.', 'pin'],
  ['Connect', 'Users can view the item, message the poster, and submit a claim when appropriate.', 'chat'],
  ['Return', 'After verification, the item can be returned to the correct owner and the case completed.', 'checkCircle'],
]

function InfoPageShell({ eyebrow, title, subtitle, children }) {
  return (
    <main className="info-page-main">
      <section className="container info-page-hero">
        <p className="hero-eyebrow">
          <Icon name="shield" />
          <span>{eyebrow}</span>
        </p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      {children}
    </main>
  )
}

function SectionGrid({ sections }) {
  return (
    <section className="section section-light">
      <div className="container info-card-grid">
        {sections.map(([title, description]) => (
          <article className="simple-info-card info-policy-card" key={title}>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export function PrivacyPolicyPage() {
  return (
    <InfoPageShell
      eyebrow="FindIt privacy"
      title="Privacy Policy"
      subtitle="A simple overview of what FindIt collects and how it is used in this student Lost & Found system."
    >
      <SectionGrid sections={privacySections} />
    </InfoPageShell>
  )
}

export function SecurityPage() {
  return (
    <InfoPageShell
      eyebrow="FindIt safety"
      title="Security"
      subtitle="How FindIt keeps reporting, reviewing, messaging, and item returns safer for the community."
    >
      <SectionGrid sections={securitySections} />
    </InfoPageShell>
  )
}

export function HowItWorksPage() {
  return (
    <InfoPageShell
      eyebrow="FindIt workflow"
      title="How It Works"
      subtitle="From report submission to item return, FindIt keeps each case clear and trackable."
    >
      <section className="section section-light">
        <div className="container info-workflow-grid">
          {workflowSteps.map(([title, description, icon], index) => (
            <article className="step-card info-workflow-card" key={title}>
              <div className="step-icon">
                <Icon name={icon} />
              </div>
              <span>Step {index + 1}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </InfoPageShell>
  )
}
