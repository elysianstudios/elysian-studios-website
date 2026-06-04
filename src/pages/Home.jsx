import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import PostCard from '../components/PostCard'
import posts from '../data/posts.json'
import styles from '../styles/Home.module.css'

gsap.registerPlugin(ScrollTrigger)

const FALLBACK = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80'

const heroPosts    = posts.slice(0, 5)
const carouselPosts = posts.slice(5, 13)
const archivePosts  = posts.slice(1, 5)
const thinkerPosts  = posts.slice(5, 9)

export default function Home() {
  const location = useLocation()

  // ── Scroll-to-section on cross-page navigation ─────────────
  useEffect(() => {
    const section = location.state?.scrollTo
    if (section) {
      const attempt = () => {
        const el = document.getElementById(section)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
      setTimeout(attempt, 100)
    }
  }, [location.state])

  // ── Hero Carousel state ────────────────────────────────────
  const [activeIdx,      setActiveIdx]      = useState(0)
  const [transitioning,  setTransitioning]  = useState(false)
  const heroAutoRef  = useRef(null)
  const heroRef      = useRef(null)

  const heroDragRef = useRef({ active: false, startX: 0 })

  const goHero = (idx) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setActiveIdx(idx)
      setTransitioning(false)
    }, 320)
  }

  const startHeroAuto = () => {
    clearInterval(heroAutoRef.current)
    heroAutoRef.current = setInterval(() => {
      setActiveIdx(i => (i + 1) % heroPosts.length)
    }, 6000)
  }

  useEffect(() => {
    startHeroAuto()
    return () => clearInterval(heroAutoRef.current)
  }, [])

  const onHeroDragStart = (e) => {
    heroDragRef.current.active = true
    heroDragRef.current.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX
    clearInterval(heroAutoRef.current)
  }

  const onHeroDragEnd = (e) => {
    if (!heroDragRef.current.active) return
    heroDragRef.current.active = false
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX
    const diff = heroDragRef.current.startX - endX
    if (Math.abs(diff) > 50) {
      if (diff > 0) goHero((activeIdx + 1) % heroPosts.length)
      else goHero((activeIdx - 1 + heroPosts.length) % heroPosts.length)
    }
    startHeroAuto()
  }

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
    // Parallax on ELYSIAN text — desktop only
    if (window.innerWidth > 768) {
      gsap.to('.quote-bg-text', {
        y: -80,
        ease: 'none',
        scrollTrigger: {
          trigger: '.quote-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      })
    }

    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  // ── Chronicles Carousel ────────────────────────────────────
  const carRef     = useRef(null)
  const trackRef   = useRef(null)
  const currentIdx = useRef(0)
  const dragRef    = useRef({ active: false, startX: 0, startTr: 0, curTr: 0 })
  const autoRef    = useRef(null)

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

  // ── Hero word-by-word entrance (spring/bubbly easing) ───────
  useEffect(() => {
    if (window.innerWidth <= 768) return
    const words = document.querySelectorAll('.hero-word')
    if (!words.length) return
    gsap.fromTo(words,
      { y: 28, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, stagger: 0.04, duration: 0.65, ease: 'back.out(1.7)', delay: 0.25 }
    )
    gsap.fromTo('.hero-cat-label',
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)', delay: 0.1 }
    )
    gsap.fromTo('.hero-excerpt-text',
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.4)', delay: 0.55 }
    )
    gsap.fromTo('.hero-actions-block',
      { y: 12, opacity: 0, scale: 0.97 },
      { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(2)', delay: 0.72 }
    )
  }, [activeIdx])

  const activePost = heroPosts[activeIdx]

  return (
    <div className={styles.page}>

      {/* ── Immersive Hero Carousel ───────────────────────────── */}
      <section
        className={styles.heroCarousel}
        ref={heroRef}
        id="home"
        onMouseEnter={() => clearInterval(heroAutoRef.current)}
        onMouseLeave={startHeroAuto}
        onMouseDown={onHeroDragStart}
        onMouseUp={onHeroDragEnd}
        onTouchStart={onHeroDragStart}
        onTouchEnd={onHeroDragEnd}
      >
        {/* Background layers — cross-fade */}
        {heroPosts.map((post, i) => (
          <div
            key={post.id}
            className={`${styles.heroBgSlide} ${i === activeIdx ? styles.heroBgActive : ''}`}
          >
            <img
              src={post.image || FALLBACK}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              onError={e => { e.target.src = FALLBACK }}
            />
            <div className={styles.heroBgOverlay} />
          </div>
        ))}

        <div className="grain-overlay" />
        <div className={styles.heroBlob} aria-hidden="true" />

        {/* Bottom-left info */}
        <div className={`${styles.heroInfo} ${transitioning ? styles.heroInfoOut : ''}`}>
          {activePost.categories?.[0] && (
            <span className={`${styles.heroCategory} hero-cat-label`}>{activePost.categories[0]}</span>
          )}
          <h1 className={styles.heroTitle}>
            {activePost.title.split(' ').map((word, i) => (
              <span key={i} className={`${styles.heroWord} hero-word`}>{word}{' '}</span>
            ))}
          </h1>
          {activePost.excerpt && (
            <p className={`${styles.heroExcerpt} hero-excerpt-text`}>
              {activePost.excerpt.substring(0, 150)}…
            </p>
          )}
          <div className={`${styles.heroActions} hero-actions-block`}>
            <Link to={`/read/${activePost.slug}`} className={styles.heroCta}>
              Read Chronicle <ArrowRight size={14} />
            </Link>
            <Link to="/archive" className={styles.heroCtaGhost}>
              Explore Archive
            </Link>
          </div>
        </div>

        {/* Right-side preview stack */}
        <div className={styles.heroStack}>
          {heroPosts.map((post, i) => (
            <button
              key={post.id}
              className={`${styles.stackCard} ${i === activeIdx ? styles.stackCardActive : ''}`}
              onClick={() => goHero(i)}
              aria-label={`View: ${post.title}`}
            >
              <div className={styles.stackBar} />
              <img
                src={post.image || FALLBACK}
                alt={post.title}
                className={styles.stackImg}
                onError={e => { e.target.src = FALLBACK }}
              />
              <div className={styles.stackInfo}>
                {post.categories?.[0] && (
                  <span className={styles.stackCat}>{post.categories[0]}</span>
                )}
                <p className={styles.stackTitle}>{post.title.substring(0, 48)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Progress indicators */}
        <div className={styles.heroIndicators}>
          {heroPosts.map((_, i) => (
            <button
              key={i}
              className={`${styles.heroDot} ${i === activeIdx ? styles.heroDotActive : ''}`}
              onClick={() => goHero(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Scroll hint */}
        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine} />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── Section Divider ───────────────────────────────────── */}
      <div className={styles.sectionDivider} aria-hidden="true">
        <span className={styles.dividerGlyph}>✦</span>
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
                  <p className={styles.thinkerHoverTitle}>{post.title.substring(0, 60)}</p>
                  {post.categories?.[0] && (
                    <span className={styles.thinkerHoverCat}>{post.categories[0]}</span>
                  )}
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
        </div>
      </section>
    </div>
  )
}
