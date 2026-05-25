import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import styles from '../styles/Nav.module.css'

const links = [
  { label: 'Chronicles', href: '/#chronicles' },
  { label: 'Archive',    href: '/archive' },
  { label: 'Thinkers',   href: '/#thinkers' },
  { label: 'Team',       href: '/team' },
]

export default function Nav() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false) }, [location])

  const handleHashLink = (e, href) => {
    if (href.startsWith('/#')) {
      if (location.pathname === '/') {
        e.preventDefault()
        const id = href.slice(2)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoE}>E</span>LYSIAN
          </Link>

          <ul className={styles.links}>
            {links.map(l => (
              <li key={l.label}>
                {l.href.startsWith('/#') ? (
                  <a href={l.href} onClick={e => handleHashLink(e, l.href)} className={styles.link}>
                    {l.label}
                  </a>
                ) : (
                  <Link to={l.href} className={`${styles.link} ${location.pathname === l.href ? styles.active : ''}`}>
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
            l.href.startsWith('/#') ? (
              <a
                key={l.label}
                href={l.href}
                className={styles.mobileLink}
                style={{ '--i': i }}
                onClick={e => { handleHashLink(e, l.href); setMenuOpen(false) }}
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
          "Elysian is the echo of infinity,<br />where silence speaks in symphony."
        </p>
      </div>
    </>
  )
}
