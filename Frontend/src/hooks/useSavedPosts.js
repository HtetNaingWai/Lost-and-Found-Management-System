import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'

function mergePost(posts, nextPost) {
  if (!nextPost?.id) return posts

  return [
    nextPost,
    ...posts.filter((post) => post.id !== nextPost.id),
  ]
}

function removePost(posts, postId) {
  return posts.filter((post) => post.id !== postId)
}

function normalizeError(error, fallback) {
  return error?.payload?.message ?? error?.message ?? fallback
}

export function useSavedPosts(token) {
  const [savedPosts, setSavedPosts] = useState([])
  const [savedPostIds, setSavedPostIds] = useState([])
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(true)
  const [savingPostId, setSavingPostId] = useState(null)
  const [savedFeedback, setSavedFeedback] = useState('')
  const [savedError, setSavedError] = useState('')

  const savedPostIdSet = useMemo(() => new Set(savedPostIds), [savedPostIds])

  useEffect(() => {
    if (!token) {
      setSavedPosts([])
      setSavedPostIds([])
      setLoadingSavedPosts(false)
      return undefined
    }

    let ignore = false

    const loadSavedPosts = async () => {
      setLoadingSavedPosts(true)
      setSavedError('')

      try {
        const payload = await apiRequest('/saved-posts', { token })

        if (ignore) return

        const posts = payload.posts ?? []
        setSavedPosts(posts)
        setSavedPostIds(payload.ids ?? posts.map((post) => post.id))
      } catch (error) {
        if (!ignore) {
          setSavedError(normalizeError(error, 'Failed to load saved posts.'))
        }
      } finally {
        if (!ignore) {
          setLoadingSavedPosts(false)
        }
      }
    }

    void loadSavedPosts()

    return () => {
      ignore = true
    }
  }, [token])

  useEffect(() => {
    if (!savedFeedback && !savedError) return undefined

    const timer = window.setTimeout(() => {
      setSavedFeedback('')
      setSavedError('')
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [savedError, savedFeedback])

  const isSaved = useCallback(
    (postId) => savedPostIdSet.has(postId),
    [savedPostIdSet],
  )

  const toggleSaved = useCallback(async (post) => {
    if (!post?.id || !token) return

    const postId = post.id
    const wasSaved = savedPostIdSet.has(postId)
    const previousPosts = savedPosts
    const previousIds = savedPostIds

    setSavingPostId(postId)
    setSavedError('')
    setSavedFeedback(wasSaved ? 'Removed from saved posts' : 'Post saved')
    setSavedPostIds((current) =>
      wasSaved
        ? current.filter((id) => id !== postId)
        : [postId, ...current.filter((id) => id !== postId)],
    )
    setSavedPosts((current) => (wasSaved ? removePost(current, postId) : mergePost(current, post)))

    try {
      const payload = await apiRequest(`/saved-posts/${postId}`, {
        method: wasSaved ? 'DELETE' : 'POST',
        token,
      })

      if (!wasSaved && payload.post) {
        setSavedPosts((current) => mergePost(current, payload.post))
      }

      setSavedFeedback(payload.message ?? (wasSaved ? 'Removed from saved posts' : 'Post saved'))
    } catch (error) {
      setSavedPosts(previousPosts)
      setSavedPostIds(previousIds)
      setSavedFeedback('')
      setSavedError(normalizeError(error, 'Could not update saved posts.'))
    } finally {
      setSavingPostId(null)
    }
  }, [savedPostIdSet, savedPostIds, savedPosts, token])

  const removeSavedPost = useCallback((postId) => {
    setSavedPostIds((current) => current.filter((id) => id !== postId))
    setSavedPosts((current) => removePost(current, postId))
  }, [])

  const replaceSavedPost = useCallback((post) => {
    if (!post?.id) return

    setSavedPosts((current) =>
      current.map((savedPost) => (savedPost.id === post.id ? post : savedPost)),
    )
  }, [])

  return {
    savedPosts,
    savedPostIds,
    isSaved,
    toggleSaved,
    loadingSavedPosts,
    savingPostId,
    savedFeedback,
    savedError,
    removeSavedPost,
    replaceSavedPost,
  }
}
