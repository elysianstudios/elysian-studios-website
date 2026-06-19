import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db, POSTS_COLLECTION } from '../lib/firebase'

// Session cache so navigation doesn't re-hit Firestore.
let cache = null
let inflight = null

export function fetchPosts(force = false) {
  if (force) { cache = null; inflight = null }
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = getDocs(collection(db, POSTS_COLLECTION))
      .then(snap => {
        const list = snap.docs.map(d => {
          const data = d.data()
          return { ...data, id: data.id ?? d.id }
        })
        list.sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
        cache = list
        return list
      })
      .finally(() => { inflight = null })
  }
  return inflight
}

export function clearPostsCache() { cache = null }

const PostsContext = createContext({ posts: [], loading: true, error: null, refresh: () => {} })

export function PostsProvider({ children }) {
  const [posts, setPosts]     = useState(cache || [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError]     = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchPosts(true)
      setPosts(list)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let alive = true
    fetchPosts()
      .then(list => { if (alive) { setPosts(list); setLoading(false) } })
      .catch(e => { if (alive) { setError(e); setLoading(false) } })
    return () => { alive = false }
  }, [])

  return (
    <PostsContext.Provider value={{ posts, loading, error, refresh }}>
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  return useContext(PostsContext)
}
