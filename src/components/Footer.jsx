import { Link } from 'react-router-dom'
import { Share2, MessageCircle, Rss, Mail } from 'lucide-react'
import styles from '../styles/Footer.module.css'

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
            <a href="https://instagram.com/elysianstudios" aria-label="Instagram" target="_blank" rel="noopener">
              <Share2 size={16} />
            </a>
            <a href="https://x.com/elysianstudios" aria-label="X / Twitter" target="_blank" rel="noopener">
              <MessageCircle size={16} />
            </a>
            <a href="/rss.xml" aria-label="RSS Feed">
              <Rss size={16} />
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
              <li><Link to="/#thinkers">Thinkers</Link></li>
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
              const msg = document.createElement('div')
              msg.className = 'toast show'
              msg.textContent = 'Welcome to Elysian. ✦'
              document.body.appendChild(msg)
              setTimeout(() => msg.remove(), 4000)
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
