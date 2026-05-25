import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import PostCard from '../components/PostCard'
import Cursor from '../components/Cursor'
import posts from '../data/posts.json'
import styles from '../styles/Home.module.css'

gsap.registerPlugin(ScrollTrigger)

const UNSPLASH = 'https://images.unsplash.com/'
const heroImages = [
  UNSPLASH + 'photo-1553356084-58ef4a67b2a7?w=400&q=80',
  UNSPLASH + 'photo-1507003211169-0a1dd7228f2d?w=400&q=80',
]

const featured = posts[0]
const carouselPosts = posts.slice(0, 8)
const archivePosts  = posts.slice(1, 5)
const thinkerPosts  = posts.slice(5, 9)

const QUOTES = [
  { text: 'The measure of intelligence is the ability to change.', author: 'Albert Einstein' },
  { text: 'In every walk with nature, one receives far more than he seeks.', author: 'John Muir' },
  { text: 'The present is theirs; the future, for which I really worked, is mine.', author: 'Nikola Tesla' },
]

export default function Home() {
  const heroRef    = useRef(null)
  const carRef     = useRef(null)
  const trackRef   = useRef(null)
  const currentIdx = useRef(0)
  const dragRef    = useRef({ active: false, startX: 0, startTr: 0, curTr: 0 })
  const autoRef    = useRef(null)

  // ── GSAP Hero ──────────────────────────────────────────────
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo('.hero-line', { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 1 }, 0.2)
      .fromTo('.hero-sub-text', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, 0.9)
      .fromTo('.hero-actions-wrap', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, 1.1)
      .fromTo('.hero-portrait-1', { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 }, 0.5)
      .fromTo('.hero-portrait-2', { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 1.2 }, 0.7)

    // Hero parallax
    gsap.to('.hero-portrait-1', {
      y: 60,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to('.hero-portrait-2', {
      y: 40,
      ease: 'none',
      scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
    })
  }, [])

  // ── Scroll reveals ─────────────────────────────────────────
  useEffect(() => {
    const els = document.querySelectorAll('.gsap-reveal')
    els.forEach((el) => {
      gsap.fromTo(el,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
        }
      )
    })
    const staggerEls = document.querySelectorAll('.gsap-stagger')
    staggerEls.forEach(group => {
      gsap.fromTo(group.children,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: group, start: 'top 85%', toggleActions: 'play none none none' },
        }
      )
    })
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  // ── Carousel ───────────────────────────────────────────────
  const getVisible = () => {
    if (window.innerWidth < 768) return 1
    if (window.innerWidth < 1100) return 2
    return 3
  }
  const maxIdx = () => Math.max(0, carouselPosts.length - getVisible())
  const getCardW = () => {
    if (!trackRef.current) return 0
    const card = trackRef.current.querySelector('[data-card]')
    if (!card) return 0
    const gap = parseFloat(getComputedStyle(trackRef.current).gap) || 24
    return card.offsetWidth + gap
  }

  const goTo = (idx) => {
    const i = Math.max(0, Math.min(idx, maxIdx()))
    currentIdx.current = i
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)'
      trackRef.current.style.transform = `translateX(-${i * getCardW()}px)`
    }
    // update dots
    document.querySelectorAll('[data-dot]').forEach((d, di) => {
      d.classList.toggle(styles.dotActive, di === i)
    })
    const prev = document.getElementById('carousel-prev')
    const next = document.getElementById('carousel-next')
    if (prev) prev.disabled = i === 0
    if (next) next.disabled = i >= maxIdx()
  }

  const startAuto = () => {
    stopAuto()
    autoRef.current = setInterval(() => {
      goTo(currentIdx.current < maxIdx() ? currentIdx.current + 1 : 0)
    }, 5000)
  }
  const stopAuto = () => clearInterval(autoRef.current)

  useEffect(() => {
    startAuto()
    const onResize = () => goTo(0)
    window.addEventListener('resize', onResize)
    return () => { stopAuto(); window.removeEventListener('resize', onResize) }
  }, [])

  const onDragStart = (e) => {
    dragRef.current.active = true
    dragRef.current.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    dragRef.current.startTr = currentIdx.current * getCardW()
    if (trackRef.current) trackRef.current.style.transition = 'none'
    stopAuto()
  }
  const onDragMove = (e) => {
    if (!dragRef.current.active) return
    const x = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const diff = x - dragRef.current.startX
    dragRef.current.curTr = dragRef.current.startTr - diff
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${Math.max(0, dragRef.current.curTr)}px)`
    }
  }
  const onDragEnd = () => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const moved = dragRef.current.startTr - dragRef.current.curTr
    const thresh = getCardW() * 0.25
    if (moved > thresh) goTo(currentIdx.current + 1)
    else if (moved < -thresh) goTo(currentIdx.current - 1)
    else goTo(currentIdx.current)
    startAuto()
  }

  return (
    <div className={styles.page}>
      <Cursor />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero} ref={heroRef} id="home">
        <div className="grain-overlay" />
        <div className={styles.heroBg}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
        </div>

        <div className={styles.heroContent}>
          <p className={`section-label hero-line`}>A Digital Sanctuary</p>
          <h1 className={styles.heroTitle}>
            <span className={`hero-line ${styles.heroLine}`}>Elysian is the</span>
            <span className={`hero-line ${styles.heroLineItalic}`}>echo of infinity,</span>
            <span className={`hero-line ${styles.heroLine}`}>Where silence speaks</span>
            <span className={`hero-line ${styles.heroLineGold}`}>in symphony.</span>
          </h1>
          <p className={`${styles.heroSub} hero-sub-text`}>
            A space unfettered by time or place. Where stories breathe,<br />
            and figures of history find their stage.
          </p>
          <div className={`${styles.heroActions} hero-actions-wrap`}>
            <Link to="/archive" className="btn btn-primary">Begin Reading</Link>
            <a href="#chronicles" className="btn btn-ghost"
              onClick={e => { e.preventDefault(); document.getElementById('chronicles')?.scrollIntoView({ behavior: 'smooth' }) }}>
              Explore Archive
            </a>
          </div>
        </div>

        <div className={styles.heroPortraits}>
          <div className={`${styles.portrait} ${styles.portrait1} hero-portrait-1`}>
            <img src={heroImages[0]} alt="Historical figure" />
            <div className={styles.portraitCaption}>
              <span className={styles.captionName}>Devī Mīrā Bai</span>
              <span className={styles.captionEra}>1498 – 1547</span>
            </div>
          </div>
          <div className={`${styles.portrait} ${styles.portrait2} hero-portrait-2`}>
            <img src={heroImages[1]} alt="Historical figure" />
            <div className={styles.portraitCaption}>
              <span className={styles.captionName}>Rani Lakshmi Bai</span>
              <span className={styles.captionEra}>1828 – 1858</span>
            </div>
          </div>
        </div>

        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine} />
          <span>Scroll</span>
        </div>

        <div className={styles.issueNo}>01</div>
      </section>

      {/* ── Marquee ───────────────────────────────────────────── */}
      <div className={styles.marqueeStrip}>
        <div className={styles.marqueeTrack}>
          {Array(4).fill(null).map((_, i) => (
            <span key={i} className={styles.marqueeGroup}>
              <span>Chronicles of the Eternal</span>
              <span className={styles.marqueeDot}>✦</span>
              <span>Voices Across Centuries</span>
              <span className={styles.marqueeDot}>✦</span>
              <span>The Art of Living Fully</span>
              <span className={styles.marqueeDot}>✦</span>
              <span>Portraits of Greatness</span>
              <span className={styles.marqueeDot}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Chronicles Carousel ───────────────────────────────── */}
      <section className={styles.chronicles} id="chronicles">
        <div className="container">
          <div className={`${styles.sectionHeader} gsap-reveal`}>
            <span className="section-label">Latest Chronicles</span>
            <h2 className="section-title">Lives That Shaped Eternity</h2>
          </div>
          <div className={styles.carouselWrapper} ref={carRef}>
            <div
              className={styles.carouselTrack}
              ref={trackRef}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
              onMouseEnter={stopAuto}
            >
              {carouselPosts.map((post) => (
                <div key={post.id} className={styles.carouselCard} data-card>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
            <div className={styles.carouselControls}>
              <button
                id="carousel-prev"
                className={styles.carouselBtn}
                onClick={() => goTo(currentIdx.current - 1)}
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <div className={styles.carouselDots}>
                {Array.from({ length: carouselPosts.length - getVisible() + 1 }, (_, i) => (
                  <button
                    key={i}
                    data-dot
                    className={`${styles.dot} ${i === 0 ? styles.dotActive : ''}`}
                    onClick={() => goTo(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                id="carousel-next"
                className={styles.carouselBtn}
                onClick={() => goTo(currentIdx.current + 1)}
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Essay ────────────────────────────────────── */}
      {featured && (
        <section className={styles.featured}>
          <div className={`container ${styles.featuredInner}`}>
            <div className={`${styles.featuredText} gsap-reveal`}>
              <span className="section-label">Featured Chronicle</span>
              <h2 className={styles.featuredTitle}>{featured.title}</h2>
              <div className="divider" />
              <blockquote className={styles.pullQuote}>
                <span className={styles.quoteGlyph}>"</span>
                {featured.excerpt?.substring(0, 200)}
                <span className={styles.quoteGlyph}>"</span>
              </blockquote>
              <Link to={`/read/${featured.slug}`} className="btn btn-primary">
                Read Chronicle <ArrowRight size={14} />
              </Link>
            </div>
            <div className={`${styles.featuredVisual} gsap-reveal`}>
              <div className={styles.featuredImgWrap}>
                <img
                  src={featured.image || `https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=80`}
                  alt={featured.title}
                  className={styles.featuredImg}
                />
                <div className={styles.featuredFrame} />
              </div>
              <div className={styles.featuredStat}>
                <span className={styles.statNum}>{featured.readTime || 5}</span>
                <span className={styles.statLabel}>Minutes Read</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Archive Preview ───────────────────────────────────── */}
      <section className={styles.archivePreview} id="archive-preview">
        <div className="container">
          <div className={`${styles.sectionHeader} ${styles.sectionHeaderRow} gsap-reveal`}>
            <div>
              <span className="section-label">The Archive</span>
              <h2 className="section-title">Every Life, A Universe</h2>
            </div>
            <Link to="/archive" className="btn btn-ghost">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className={`${styles.archiveGrid} gsap-stagger`}>
            {archivePosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Grand Quote ───────────────────────────────────────── */}
      <section className={styles.quoteSection}>
        <div className={styles.quoteBgText}>ELYSIAN</div>
        <blockquote className={`${styles.grandQuote} gsap-reveal`}>
          <p>"{QUOTES[0].text}"</p>
          <cite>— {QUOTES[0].author}</cite>
        </blockquote>
      </section>

      {/* ── Thinkers Spotlight ────────────────────────────────── */}
      <section className={styles.thinkers} id="thinkers">
        <div className="container">
          <div className={`${styles.sectionHeader} gsap-reveal`}>
            <span className="section-label">Thinkers Spotlight</span>
            <h2 className="section-title">Minds That Moved the World</h2>
          </div>
          <div className={`${styles.thinkersGrid} gsap-stagger`}>
            {thinkerPosts.map(post => (
              <Link key={post.id} to={`/read/${post.slug}`} className={styles.thinkerCard}>
                <div className={styles.thinkerImg}>
                  <img
                    src={post.image || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80`}
                    alt={post.title}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
                  />
                </div>
                <div className={styles.thinkerInfo}>
                  <h4>{post.title.substring(0, 50)}</h4>
                  <span className={styles.thinkerCat}>{post.categories?.[0] || 'Elysian'}</span>
                </div>
                <div className={styles.thinkerHover}>
                  <p>{post.excerpt?.substring(0, 120)}…</p>
                  <span className={styles.thinkerRead}>Read Chronicle →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────────────── */}
      <section className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <div className={`${styles.newsletterText} gsap-reveal`}>
            <span className="section-label">Join the Sanctuary</span>
            <h2>Receive the chronicles.<br /><em>Carry the wisdom.</em></h2>
            <p>New essays, portraits, and meditations — delivered with intention, not noise.</p>
          </div>
          <form className={`${styles.newsletterForm} gsap-reveal`} onSubmit={e => {
            e.preventDefault()
            const toast = document.createElement('div')
            toast.className = 'toast'
            toast.textContent = 'Welcome to Elysian! ✦ Your first chronicle arrives soon.'
            document.body.appendChild(toast)
            requestAnimationFrame(() => toast.classList.add('show'))
            setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400) }, 4000)
            e.target.reset()
          }}>
            <input type="email" placeholder="Your email address" required className={styles.emailInput} />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
          <p className={`${styles.newsletterNote} gsap-reveal`}>No algorithms. No clutter. Only the eternal.</p>
        </div>
      </section>
    </div>
  )
}
