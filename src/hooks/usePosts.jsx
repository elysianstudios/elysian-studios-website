import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'
import { db, POSTS_COLLECTION } from '../lib/firebase'

let cache = null

function snapToList(snap) {
  const list = snap.docs.map(d => {
    const data = d.data()
    return { ...data, id: data.id ?? d.id }
  })
  list.sort((a, b) => new Date(b.date) - new Date(a.date)) // newest first
  return list
}

// One-off fetch (used where a Promise is handy). The live data path is the
// onSnapshot subscription in PostsProvider below.
export async function fetchPosts() {
  if (cache) return cache
  cache = snapToList(await getDocs(collection(db, POSTS_COLLECTION)))
  return cache
}

export function clearPostsCache() { cache = null }

const PostsContext = createContext({ posts: [], loading: true, error: null, refresh: () => {} })

export function PostsProvider({ children }) {
  const [posts, setPosts]     = useState(cache || [])
  const [loading, setLoading] = useState(!cache)
  const [error, setError]     = useState(null)

  // Live subscription: any add / edit / delete in Firestore reflects here
  // instantly, so the site is never stale after an admin change.
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, POSTS_COLLECTION),
      snap => { const list = snapToList(snap); cache = list; setPosts(list); setError(null); setLoading(false) },
      err => { setError(err); setLoading(false) }
    )
    return unsub
  }, [])

  const refresh = useCallback(async () => {
    try {
      clearPostsCache()
      const list = await fetchPosts()
      setPosts(list)
    } catch (e) { setError(e) }
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
