import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardPageShell from '../components/DashboardPageShell'
import Icon from '../components/Icon'
import RatingSummary from '../components/ratings/RatingSummary'
import ReviewList from '../components/ratings/ReviewList'
import { apiRequest } from '../services/api'
import { formatDate } from '../utils/formatDate'
import { resolveImageUrl } from '../utils/imageUrl'

function normalizeUserId(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getPostTime(post) {
  return new Date(post.created_at ?? post.createdAt ?? 0).getTime()
}

function ProfileAvatar({ profileUser }) {
  const imageUrl = resolveImageUrl(profileUser?.profile_image_url ?? profileUser?.profileImageUrl)

  return (
    <span className="public-profile-avatar">
      {imageUrl ? (
        <img src={imageUrl} alt={profileUser.name} />
      ) : (
        (profileUser?.name || 'U').charAt(0).toUpperCase()
      )}
    </span>
  )
}

function SafeInfoCard({ label, value }) {
  return (
    <div className="public-profile-info-card">
      <span>{label}</span>
      <strong>{value || 'Not shared'}</strong>
    </div>
  )
}

function PublicProfilePage({
  user,
  token,
  posts = [],
  approvedItems = [],
  myItems = [],
}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const profileUserId = normalizeUserId(id)
  const [profilePayload, setProfilePayload] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewMeta, setReviewMeta] = useState(null)
  const [loadingReviews, setLoadingReviews] = useState(false)
  const allPosts = useMemo(
    () => [...posts, ...approvedItems, ...myItems],
    [approvedItems, myItems, posts],
  )

  const loadPublicProfile = useCallback(async () => {
    if (!profileUserId) {
      setProfileError('User not found.')
      setLoadingProfile(false)
      return
    }

    setLoadingProfile(true)
    setProfileError('')

    try {
      const payload = await apiRequest(`/users/${profileUserId}/public-profile`, { token })
      setProfilePayload(payload)
      setReviews(payload.recent_reviews ?? [])
      setReviewMeta(null)
      setReviewPage(1)
    } catch (error) {
      setProfileError(error.payload?.message ?? 'Failed to load this public profile.')
    } finally {
      setLoadingProfile(false)
    }
  }, [profileUserId, token])

  useEffect(() => {
    void loadPublicProfile()
  }, [loadPublicProfile])

  const profileUser = profilePayload?.user ?? null
  const stats = profilePayload?.stats ?? {
    lost_posts: 0,
    found_posts: 0,
    successful_returns: 0,
  }
  const availability = profilePayload?.availability ?? {}
  const ratingSummary = profilePayload?.rating_summary ?? { average: null, count: 0 }

  const publicPosts = useMemo(() => {
    if (!profileUserId) return []

    const uniquePosts = new Map()

    allPosts.forEach((post) => {
      const postType = post.post_type ?? post.type
      const isPublicItem = ['lost', 'found'].includes(postType)
      const isVisible = post.status === 'approved'

      if (Number(post.user?.id) === profileUserId && isPublicItem && isVisible) {
        uniquePosts.set(post.id, post)
      }
    })

    return Array.from(uniquePosts.values()).sort((left, right) => getPostTime(right) - getPostTime(left))
  }, [allPosts, profileUserId])

  const memberSince = profileUser?.member_since
    ? formatDate(profileUser.member_since, { month: 'long', year: 'numeric' })
    : 'Recently joined'
  const isOwnProfile = Number(user?.id) === profileUserId
  const hasMoreReviews = ratingSummary.count > reviews.length
  const handleBack = () => navigate(-1)
  const handleMessageUser = () => {
    if (!profileUser?.id || isOwnProfile) return
    navigate(`/messages?user=${profileUser.id}`)
  }

  const handleLoadMoreReviews = async () => {
    if (!profileUserId || loadingReviews) return

    const nextPage = reviewMeta ? reviewPage + 1 : 1
    setLoadingReviews(true)

    try {
      const payload = await apiRequest(`/users/${profileUserId}/ratings?page=${nextPage}`, { token })
      setReviews((current) => {
        const uniqueReviews = new Map()
        ;[...current, ...(payload.reviews ?? [])].forEach((review) => uniqueReviews.set(review.id, review))
        return Array.from(uniqueReviews.values())
      })
      setReviewMeta(payload.meta ?? null)
      setReviewPage(payload.meta?.current_page ?? nextPage)
    } catch {
      setProfileError('Failed to load reviews.')
    } finally {
      setLoadingReviews(false)
    }
  }

  if (loadingProfile) {
    return (
      <DashboardPageShell>
        <section className="public-profile-skeleton" aria-label="Loading public profile">
          <div />
          <div />
          <div />
        </section>
      </DashboardPageShell>
    )
  }

  if (profileError || !profileUser) {
    return (
      <DashboardPageShell>
        <section className="public-profile-empty">
          <h1>{profileError === 'User not found.' ? 'User not found.' : 'Public profile unavailable'}</h1>
          <p>{profileError || 'This profile is currently unavailable.'}</p>
          <div className="public-profile-actions">
            <button type="button" className="secondary-action-button" onClick={() => navigate('/community')}>
              Back to Community
            </button>
            <button type="button" className="quick-action-button" onClick={loadPublicProfile}>
              Retry
            </button>
          </div>
        </section>
      </DashboardPageShell>
    )
  }

  return (
    <DashboardPageShell>
      <section className="public-profile-shell">
        {!isOwnProfile ? (
          <button type="button" className="public-profile-back-button" onClick={handleBack}>
            <Icon name="arrowLeft" />
            Back
          </button>
        ) : null}

        <div className="public-profile-hero">
          <ProfileAvatar profileUser={profileUser} />
          <div className="public-profile-hero-copy">
            <span className="eyebrow">Public Member Profile</span>
            <h1>{profileUser.name}</h1>
            {availability.status === 'unavailable' ? (
              <p>{availability.message}</p>
            ) : (
              <RatingSummary summary={ratingSummary} />
            )}
          </div>
          <div className="public-profile-actions">
            {isOwnProfile ? (
              <button type="button" className="quick-action-button" onClick={() => navigate('/profile')}>
                Edit Profile
              </button>
            ) : availability.can_message ? (
              <button
                type="button"
                className="quick-action-button"
                onClick={handleMessageUser}
              >
                Message User
              </button>
            ) : null}
          </div>
        </div>

        <div className="public-profile-stats">
          <SafeInfoCard label="Member Since" value={memberSince} />
          <SafeInfoCard label="Successful Returns" value={String(stats.successful_returns ?? 0)} />
          <SafeInfoCard label="Lost Reports" value={String(stats.lost_posts ?? 0)} />
          <SafeInfoCard label="Found Reports" value={String(stats.found_posts ?? 0)} />
        </div>

        <div className="public-profile-grid">
          <section className="public-profile-panel">
            <h2>Public Contact</h2>
            <p>Members control what contact details they share publicly.</p>
            <div className="public-profile-contact-list">
              <SafeInfoCard label="Email" value={profileUser.public_email} />
              <SafeInfoCard label="Phone" value={profileUser.public_phone} />
              <SafeInfoCard label="Area" value={profileUser.public_location} />
            </div>
          </section>

          <section className="public-profile-panel">
            <h2>Recent Reviews</h2>
            <ReviewList
              reviews={reviews}
              hasMore={hasMoreReviews}
              loading={loadingReviews}
              onLoadMore={handleLoadMoreReviews}
            />
          </section>
        </div>

        <section className="public-profile-panel">
          <h2>Recent Public Posts</h2>
          {publicPosts.length > 0 ? (
            <div className="public-profile-post-list">
              {publicPosts.slice(0, 6).map((post) => {
                const postType = post.post_type ?? post.type
                return (
                  <article className="public-profile-post" key={post.id}>
                    <span className={`badge badge-type ${postType === 'lost' ? 'badge-lost' : postType === 'found' ? 'badge-found' : 'badge-approved'}`}>
                      {postType === 'lost' ? 'Lost' : postType === 'found' ? 'Found' : 'Community'}
                    </span>
                    <div>
                      <strong>{post.title || 'Community Post'}</strong>
                      <p>{post.content || post.description || 'No description provided.'}</p>
                    </div>
                    <span>{formatDate(post.created_at ?? post.createdAt)}</span>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="public-profile-placeholder">
              <Icon name="document" />
              <strong>No public posts yet</strong>
              <p>Approved lost and found posts from this member will appear here.</p>
            </div>
          )}
        </section>
      </section>
    </DashboardPageShell>
  )
}

export default PublicProfilePage
