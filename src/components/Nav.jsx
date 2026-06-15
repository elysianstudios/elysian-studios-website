import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import styles from '../styles/Nav.module.css'

const links = [
  { label: 'Chronicles', section: 'chronicles' },
  { label: 'Archive',    href: '/archive' },
  { label: 'Thinkers',   section: 'thinkers' },
  { label: 'About',      href: '/about' },
]

export default function Nav() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60)
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  const onDark = location.pathname === '/' && !scrolled

  const scrollToSection = (section, e) => {
    if (e) e.preventDefault()
    if (location.pathname === '/') {
      document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/', { state: { scrollTo: section } })
    }
  }

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''} ${onDark ? styles.onDark : ''}`}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            ELYSIAN
          </Link>

          <ul className={styles.links}>
            {links.map(l => (
              <li key={l.label}>
                {l.section ? (
                  <a
                    href={`/#${l.section}`}
                    onClick={e => scrollToSection(l.section, e)}
                    className={styles.link}
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    to={l.href}
                    className={`${styles.link} ${location.pathname === l.href ? styles.active : ''}`}
                  >
                    {l.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link to="/archive" className={`btn btn-primary ${styles.subscribeBtn}`}>
              Read Now
            </Link>
            <button
              className={styles.hamburger}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
        <button className={styles.mobileClose} onClick={() => setMenuOpen(false)} aria-label="Close">
          <X size={24} />
        </button>
        <nav className={styles.mobileLinks}>
          {links.map((l, i) => (
            l.section ? (
              <a
                key={l.label}
                href={`/#${l.section}`}
                className={styles.mobileLink}
                style={{ '--i': i }}
                onClick={e => { scrollToSection(l.section, e); setMenuOpen(false) }}
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.label}
                to={l.href}
                className={styles.mobileLink}
                style={{ '--i': i }}
              >
                {l.label}
              </Link>
            )
          ))}
          <Link to="/archive" className={`btn btn-primary ${styles.mobileCta}`} style={{ '--i': links.length }}>
            Read Now
          </Link>
        </nav>
        <p className={styles.mobileTagline}>
          Extraordinary lives.<br />Preserved. Shared. Remembered.
        </p>
      </div>
    </>
  )
}
