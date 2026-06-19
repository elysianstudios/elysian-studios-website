import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Sun, BookOpen, Moon, Share2, Copy, ArrowLeft, ArrowRight, Minus, Plus, Type } from 'lucide-react'
import PostCard from '../components/PostCard'
import { usePosts } from '../hooks/usePosts'
import { parseContent } from '../utils/parseContent'
import { sanitize } from '../utils/sanitizeHtml'
import { personName } from '../utils/postMeta'
import styles from '../styles/Reader.module.css'

const MODES = [
  { key: 'light', icon: Sun,      label: 'Light' },
  { key: 'sepia', icon: BookOpen, label: 'Sepia' },
  { key: 'dark',  icon: Moon,     label: 'Dark'  },
]

export default function Reader() {
  const { slug } = useParams()
  const navigate  = useNavigate()
  const { posts, loading } = usePosts()
  const [mode, setMode] = useState(() => localStorage.getItem('elysian-reader-mode') || 'light')
  const [fontScale, setFontScale] = useState(() => parseFloat(localStorage.getItem('elysian-reader-font')) || 1)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied]   = useState(false)
  const articleRef = useRef(null)

  const FONT_MIN = 0.85, FONT_MAX = 1.4, FONT_STEP = 0.075
  const adjustFont = (dir) => {
    setFontScale(s => {
      const next = Math.min(FONT_MAX, Math.max(FONT_MIN, +(s + dir * FONT_STEP).toFixed(3)))
      localStorage.setItem('elysian-reader-font', next)
      return next
    })
  }

  const post  = posts.find(p => p.slug === slug)
  const idx   = posts.findIndex(p => p.slug === slug)
  const prev  = idx > 0 ? posts[idx - 1] : null
  const next  = idx < posts.length - 1 ? posts[idx + 1] : null
  const related = posts.filter(p => p.slug !== slug && p.categories?.some(c => post?.categories?.includes(c))).slice(0, 3)

  useEffect(() => {
    if (!loading && !post) navigate('/archive')
  }, [post, loading])

  useEffect(() => {
    localStorage.setItem('elysian-reader-mode', mode)
    document.documentElement.setAttribute('data-reader-mode', mode)
    return () => document.documentElement.removeAttribute('data-reader-mode')
  }, [mode])

  // Reading progress
  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = el.offsetHeight
      const read  = Math.max(0, -rect.top)
      setProgress(Math.min(100, (read / total) * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      if (navigator.share) navigator.share({ title: post?.title, url: window.location.href })
    }
  }

  if (!post) {
    return loading
      ? <div className={`${styles.page} ${styles[mode]}`} style={{ padding: '8rem 1.5rem', textAlign: 'center', minHeight: '60vh' }}>Loading…</div>
      : null
  }

  const cleanHtml = sanitize(parseContent(post.content))
  const person = personName(post)

  return (
    <div className={`${styles.page} ${styles[mode]}`} data-mode={mode}>
      {/* Progress bar */}
      <div className={styles.progressBar} style={{ transform: `scaleX(${progress / 100})` }} />

      {/* Reader controls */}
      <div className={styles.controls}>
        <Link to="/archive" className={styles.backBtn}>
          <ArrowLeft size={16} /> Archive
        </Link>
        <div className={styles.controlGroup}>
          {/* Font size */}
          <div className={styles.fontControl} title="Text size">
            <button
              className={styles.fontBtn}
              onClick={() => adjustFont(-1)}
              disabled={fontScale <= FONT_MIN}
              aria-label="Decrease text size"
            >
              <Minus size={14} />
            </button>
            <Type size={15} className={styles.fontIcon} />
            <button
              className={styles.fontBtn}
              onClick={() => adjustFont(1)}
              disabled={fontScale >= FONT_MAX}
              aria-label="Increase text size"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Theme */}
          <div className={styles.modeToggle}>
            {MODES.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                className={`${styles.modeBtn} ${mode === key ? styles.modeBtnActive : ''}`}
                onClick={() => setMode(key)}
                aria-label={`${label} mode`}
                title={label}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <button className={styles.shareBtn} onClick={share} aria-label="Copy link">
            {copied ? <><Copy size={14} /> Copied!</> : <><Share2 size={14} /> Share</>}
          </button>
        </div>
      </div>

      {/* Article */}
      <article className={styles.article} ref={articleRef} style={{ '--font-scale': fontScale }}>
        {/* Header */}
        <header className={styles.header}>
          {post.categories?.[0] && (
            <span className={`tag ${styles.catTag}`}>{post.categories[0]}</span>
          )}
          <h1 className={styles.title}>{post.title}</h1>
          {post.image && (
            <figure className={styles.heroImg}>
              <img src={post.image} alt={person || post.title} />
              {person && <figcaption className={styles.heroCaption}>{person}</figcaption>}
            </figure>
          )}
        </header>

        {/* Body */}
        <div
          className={styles.body}
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className={styles.tags}>
            {post.tags.slice(0, 8).map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}
      </article>

      {/* Prev / Next */}
      <nav className={styles.prevNext}>
        {prev ? (
          <Link to={`/read/${prev.slug}`} className={styles.navLink}>
            <ArrowLeft size={16} />
            <div>
              <span className={styles.navLabel}>Previous</span>
              <span className={styles.navTitle}>{prev.title.substring(0, 60)}</span>
            </div>
          </Link>
        ) : <div />}
        {next && (
          <Link to={`/read/${next.slug}`} className={`${styles.navLink} ${styles.navLinkRight}`}>
            <div>
              <span className={styles.navLabel}>Next</span>
              <span className={styles.navTitle}>{next.title.substring(0, 60)}</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        )}
      </nav>

      {/* Related */}
      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedInner}>
            <span className="section-label">More Chronicles</span>
            <h3 className={styles.relatedTitle}>Continue Reading</h3>
            <div className={styles.relatedGrid}>
              {related.map(p => <PostCard key={p.id} post={p} variant="compact" />)}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
