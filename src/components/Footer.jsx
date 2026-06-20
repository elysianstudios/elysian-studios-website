import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import styles from '../styles/Footer.module.css'

// Paste your deployed Google Apps Script web-app URL here (see
// newsletter-backend.gs). Until then, signups just show the toast.
const NEWSLETTER_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxwoPQCRIy7daoKYjPct6GYVCJHI2_obVqVV0C_Q5ir0rTwb3JPJaH7BLIRW91aQ-mn/exec'

const InstagramIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

const LinkedInIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            ELYSIAN
          </Link>
          <p className={styles.tagline}>
            Extraordinary lives.<br />
            Preserved. Shared. Remembered.
          </p>
          <div className={styles.socials}>
            <a href="https://www.instagram.com/elysianexps/" aria-label="Instagram" target="_blank" rel="noopener">
              <InstagramIcon />
            </a>
            <a href="https://www.linkedin.com/company/elysianstudios/" aria-label="LinkedIn" target="_blank" rel="noopener">
              <LinkedInIcon />
            </a>
            <a href="mailto:elysianstudios188@gmail.com" aria-label="Email">
              <Mail size={16} />
            </a>
          </div>
        </div>

        <div className={styles.cols}>
          <div className={styles.col}>
            <h5>Explore</h5>
            <ul>
              <li><Link to="/archive">Chronicles</Link></li>
              <li><Link to="/archive">Archive</Link></li>
              <li><Link to="/" state={{ scrollTo: 'thinkers' }}>Thinkers</Link></li>
              <li><Link to="/team">Our Team</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h5>About</h5>
            <ul>
              <li><Link to="/about">Our Mission</Link></li>
              <li><Link to="/team">Editorial Team</Link></li>
              <li><Link to="/contact" state={{ reason: 'story' }}>Submit a Story</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className={styles.col}>
            <h5>Newsletter</h5>
            <form className={styles.miniForm} onSubmit={e => {
              e.preventDefault()
              const input = e.target.querySelector('input[type="email"]')
              const email = input.value.trim()
              if (!email) return
              const toast = (text) => {
                const msg = document.createElement('div')
                msg.className = 'toast show'
                msg.textContent = text
                document.body.appendChild(msg)
                setTimeout(() => msg.remove(), 4000)
              }
              if (NEWSLETTER_ENDPOINT) {
                // Apps Script needs a "simple" request (no custom Content-Type)
                // so no-cors doesn't strip the body. Fire-and-forget: the write
                // runs even though the response is opaque.
                fetch(NEWSLETTER_ENDPOINT, {
                  method: 'POST',
                  mode: 'no-cors',
                  body: JSON.stringify({ email, source: 'footer' }),
                }).catch(() => {})
              }
              // Confirm immediately (the response is opaque, and the write fires regardless).
              toast('You’re subscribed. Welcome to Elysian. ✦')
              e.target.reset()
            }}>
              <div className={styles.inputWrap}>
                <input type="email" placeholder="Your email" required />
              </div>
              <button type="submit" className="btn btn-primary">→</button>
            </form>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.dividerLine} />
        <div className={styles.bottomInner}>
          <p>© {year} Elysian Studios. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
