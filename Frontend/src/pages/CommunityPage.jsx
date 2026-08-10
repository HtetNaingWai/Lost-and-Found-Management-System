import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CreatePostModal from '../components/CreatePostModal'
import CommunityMap from '../components/CommunityMap'
import CommunityPostCard from '../components/CommunityPostCard'
import PostDetailModal from '../components/PostDetailModal'
import Icon from '../components/Icon'

const SAVED_POSTS_STORAGE_KEY = 'findit-saved-posts'

const communityMenuItems = [
  { key: 'create-post', label: 'Create Post', icon: 'plusSquare' },
  { key: 'my-posts', label: 'My Posts', icon: 'document' },
  { key: 'my-claims', label: 'My Claims', icon: 'clipboard' },
  { key: 'saved-posts', label: 'Saved Posts', icon: 'bookmark' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
]

function ImagePreviewModal({ preview, onClose }) {
  if (!preview) return null

  return (
    <div className="community-image-modal-root" onClick={onClose}>
      <div className="community-image-modal-overlay" />
      <div className="community-image-modal-shell" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close-button community-image-close" onClick={onClose}>
          <Icon name="close" />
        </button>
        <img className="community-image-modal-image" src={preview.src} alt={preview.alt} />
      </div>
    </div>
  )
}

function CommunityMenuCard({
  activeSection,
  onSelectSection,
  onOpenCreatePost,
  notifications,
  savedCount,
}) {
  return (
    <aside className="community-side-card">
      <div className="community-side-header">
        <h2>Community Menu</h2>
      </div>
      <div className="community-side-list">
        {communityMenuItems.map((item) => {
          const isActive = activeSection === item.key

          return (
            <button
              type="button"
              key={item.key}
              className={`community-side-item${isActive ? ' is-active' : ''}`}
              onClick={() => {
                if (item.key === 'create-post') {
                  onOpenCreatePost()
                  return
                }

                onSelectSection(item.key)
              }}
            >
              <span className="community-side-item-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
              {item.key === 'saved-posts' ? <small>{savedCount}</small> : null}
              {item.key === 'notifications' && notifications.length > 0 ? <small>{notifications.length}</small> : null}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

function ContentPanel({ title, subtitle, children }) {
  return (
    <section className="community-panel">
      <div className="community-panel-heading">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function PlaceholderPanel({ title, subtitle, children }) {
  return (
    <ContentPanel title={title} subtitle={subtitle}>
      <div className="community-placeholder-card">{children}</div>
    </ContentPanel>
  )
}

function CommunityPage({
  user,
  token,
  categories,
  posts,
  myPosts,
  myClaims = [],
  onCreatePost,
  onNavigate,
  notifications,
  onStartMessage,
  onSubmitClaim,
  submittingClaim = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'feed')
  const [savedPostIds, setSavedPostIds] = useState([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_POSTS_STORAGE_KEY)
      setSavedPostIds(saved ? JSON.parse(saved) : [])
    } catch {
      setSavedPostIds([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(SAVED_POSTS_STORAGE_KEY, JSON.stringify(savedPostIds))
  }, [savedPostIds])

  useEffect(() => {
    setActiveSection(searchParams.get('section') || 'feed')
  }, [searchParams])

  const orderedPosts = useMemo(
    () =>
      [...posts].sort(
        (left, right) =>
          new Date(right.created_at ?? right.createdAt).getTime()
          - new Date(left.created_at ?? left.createdAt).getTime(),
      ),
    [posts],
  )

  const orderedMyPosts = useMemo(
    () =>
      [...myPosts].sort(
        (left, right) =>
          new Date(right.created_at ?? right.createdAt).getTime()
          - new Date(left.created_at ?? left.createdAt).getTime(),
      ),
    [myPosts],
  )

  const savedPosts = useMemo(
    () => orderedPosts.filter((post) => savedPostIds.includes(post.id)),
    [orderedPosts, savedPostIds],
  )

  const toggleSavedPost = (postId) => {
    setSavedPostIds((current) =>
      current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [postId, ...current],
    )
  }

  const renderFeed = (feedPosts) => (
    <div className="community-feed">
      {feedPosts.length > 0 ? (
        feedPosts.map((post) => (
          <CommunityPostCard
            key={post.id}
            post={post}
            isSaved={savedPostIds.includes(post.id)}
            onToggleSave={toggleSavedPost}
            onClick={() => setSelectedPost(post)}
            onImageClick={(src, alt) => setImagePreview({ src, alt })}
          />
        ))
      ) : (
        <div className="community-empty-state">
          <strong>No posts to show yet.</strong>
          <p>Create a post or switch to another section.</p>
        </div>
      )}
    </div>
  )

  const renderSection = () => {
    switch (activeSection) {
      case 'my-posts':
        return (
          <ContentPanel
            title="My Posts"
            subtitle="Your community, lost, and found posts across all statuses."
          >
            {renderFeed(orderedMyPosts)}
          </ContentPanel>
        )
      case 'saved-posts':
        return (
          <ContentPanel
            title="Saved Posts"
            subtitle="Posts you bookmarked for quick access."
          >
            {renderFeed(savedPosts)}
          </ContentPanel>
        )
      case 'my-claims':
        return (
          <PlaceholderPanel
            title="My Claims"
            subtitle="Track your claim requests and review progress."
          >
            {myClaims.length > 0 ? (
              <div className="community-claim-list">
                {myClaims.map((claim) => (
                  <article className="community-claim-item" key={claim.id}>
                    <div className="community-claim-copy">
                      <strong>{claim.community_post?.title || 'Claimed item'}</strong>
                      <p>
                        {(claim.community_post?.category?.name || 'General')}
                        {' • '}
                        {claim.community_post?.location || 'No location provided'}
                      </p>
                      <p>
                        Submitted{' '}
                        {new Date(claim.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      {claim.reviewed_at ? <p>Reviewed {new Date(claim.reviewed_at).toLocaleDateString('en-US')}</p> : null}
                      {claim.returned_at ? <p>Returned {new Date(claim.returned_at).toLocaleDateString('en-US')}</p> : null}
                      {claim.admin_note ? <p>Admin note: {claim.admin_note}</p> : null}
                    </div>
                    <span className={`badge badge-status badge-${claim.status}`}>
                      {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <div className="community-empty-state">
                <strong>No claims yet.</strong>
                <p>When you recognize an approved found item, open it and submit your claim.</p>
              </div>
            )}
          </PlaceholderPanel>
        )
      case 'notifications':
        return (
          <PlaceholderPanel
            title="Notifications"
            subtitle="Recent alerts related to your account and community activity."
          >
            <div className="notification-list notification-list-panel">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <article className="notification-item" key={notification.id}>
                    <div className="notification-item-copy">
                      <strong>{notification.title}</strong>
                      <p>{notification.detail}</p>
                    </div>
                    <span>{notification.time}</span>
                  </article>
                ))
              ) : (
                <div className="notification-empty">No new notifications</div>
              )}
            </div>
          </PlaceholderPanel>
        )
      case 'feed':
      default:
        return renderFeed(orderedPosts)
    }
  }

  return (
    <>
      <section className="dashboard-section community-layout-section">
        <div className="container">
          <div className="community-layout-grid">
            <CommunityMenuCard
              activeSection={activeSection}
              onSelectSection={(section) => {
                if (section === 'messages') {
                  onNavigate('messages')
                  return
                }

                setActiveSection(section)
                setSearchParams(section === 'feed' ? {} : { section })
              }}
              onOpenCreatePost={() => setIsModalOpen(true)}
              notifications={notifications}
              savedCount={savedPosts.length}
            />

            <div className="community-main-column">
              {activeSection === 'feed' ? (
                <CommunityMap
                  posts={orderedPosts}
                  onViewDetails={(post) => setSelectedPost(post)}
                />
              ) : null}
              {renderSection()}
            </div>
          </div>
        </div>
      </section>

      <CreatePostModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        categories={categories}
        onCreatePost={onCreatePost}
      />

      <PostDetailModal
        post={selectedPost}
        user={user}
        onClose={() => setSelectedPost(null)}
        onStartMessage={(targetUser, relatedPost) => {
          setSelectedPost(null)
          onStartMessage?.(targetUser, relatedPost)
        }}
        existingClaim={myClaims.find((claim) => claim.community_post?.id === selectedPost?.id)}
        onSubmitClaim={onSubmitClaim}
        submittingClaim={submittingClaim}
      />
      <ImagePreviewModal preview={imagePreview} onClose={() => setImagePreview(null)} />
    </>
  )
}

export default CommunityPage
