import { useState, useMemo, useEffect } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import PostCard from '../components/PostCard'
import posts from '../data/posts.json'
import styles from '../styles/Archive.module.css'

const PAGE_SIZE = 12

function getAllCategories(posts) {
  const cats = new Set()
  posts.forEach(p => p.categories?.forEach(c => c && cats.add(c)))
  return ['All', ...Array.from(cats).sort()]
}

export default function Archive() {
  const [query,    setQuery]    = useState('')
  const [category, setCategory] = useState('All')
  const [page,     setPage]     = useState(1)

  const categories = useMemo(() => getAllCategories(posts), [])

  const filtered = useMemo(() => {
    let list = posts
    if (category !== 'All') {
      list = list.filter(p => p.categories?.includes(category))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.categories?.some(c => c.toLowerCase().includes(q))
      )
    }
    return list
  }, [query, category])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [query, category])

  const paginated = filtered.slice(0, page * PAGE_SIZE)
  const hasMore   = paginated.length < filtered.length

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'none' } })
    }, { threshold: 0.08 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [paginated.length])

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className="grain-overlay" />
        <div className={styles.heroContent}>
          <span className="section-label">The Archive</span>
          <h1 className={styles.heroTitle}>Every Life,<br /><em>A Universe</em></h1>
          <p className={styles.heroSub}>
            {posts.length} chronicles spanning centuries of human greatness.
          </p>
        </div>
        <div className={styles.heroDecor}>
          <span>ARCHIVE</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <div className="container">
          <div className={styles.filterInner}>
            {/* Search */}
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="search"
                placeholder="Search chronicles…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className={styles.searchInput}
                aria-label="Search posts"
              />
              {query && (
                <button onClick={() => setQuery('')} className={styles.clearBtn} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category pills */}
            <div className={styles.cats} role="group" aria-label="Filter by category">
              {categories.slice(0, 10).map(cat => (
                <button
                  key={cat}
                  className={`${styles.catBtn} ${category === cat ? styles.catActive : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className={styles.body}>
        <div className="container">
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              <p>No chronicles found for "{query || category}".</p>
              <button className="btn btn-ghost" onClick={() => { setQuery(''); setCategory('All') }}>
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className={styles.resultCount}>
                {filtered.length} chronicle{filtered.length !== 1 ? 's' : ''}
                {category !== 'All' && ` in ${category}`}
                {query && ` matching "${query}"`}
              </p>
              <div className={styles.grid}>
                {paginated.map((post, i) => (
                  <div
                    key={post.id}
                    data-reveal
                    style={{
                      opacity: 0,
                      transform: 'translateY(24px)',
                      transition: `opacity 0.5s ease ${(i % PAGE_SIZE) * 0.04}s, transform 0.5s ease ${(i % PAGE_SIZE) * 0.04}s`
                    }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className={styles.loadMoreWrap}>
                  <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)}>
                    Load more chronicles
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
