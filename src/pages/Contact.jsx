import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { Mail, Send } from 'lucide-react'
import styles from '../styles/Contact.module.css'

const EMAIL = 'elysianstudios188@gmail.com'
const REASONS = ['General enquiry', 'Submit a story', 'Partnership', 'Feedback']

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

export default function Contact() {
  const location = useLocation()
  const [reason, setReason] = useState(
    location.state?.reason === 'story' ? 'Submit a story' : 'General enquiry'
  )
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    gsap.fromTo('.contact-reveal',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'expo.out', delay: 0.1 }
    )
  }, [])

  const onSubmit = (e) => {
    e.preventDefault()
    const subject = `[${reason}] — ${name || 'Elysian enquiry'}`
    const body = `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\n${message}`
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Anchor-click is the most reliable way to trigger the OS mail handler
    // (more dependable than assigning window.location.href inside an SPA).
    const a = document.createElement('a')
    a.href = mailto
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()

    // Fallback: if no native mail client picks it up, offer Gmail's web composer.
    const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.innerHTML = `Opening your email app… ✦ &nbsp;<a href="${gmail}" target="_blank" rel="noopener" style="color:var(--gold);text-decoration:underline">Use Gmail instead</a>`
    document.body.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add('show'))
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400) }, 8000)
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="grain-overlay" />
        <div className={styles.inner}>
          <div className={styles.intro}>
            <span className={`section-label contact-reveal`}>Contact</span>
            <h1 className={`${styles.title} contact-reveal`}>
              Start a<br /><em>conversation.</em>
            </h1>
            <div className={`${styles.divider} contact-reveal`} />
            <p className={`${styles.lede} contact-reveal`}>
              Have a story worth telling, a question, or an idea to share? We read every message.
            </p>
            <div className={`${styles.directs} contact-reveal`}>
              <a href={`mailto:${EMAIL}`} className={styles.directLink}>
                <Mail size={16} /> {EMAIL}
              </a>
              <div className={styles.socials}>
                <a href="https://www.instagram.com/elysianexps/" target="_blank" rel="noopener" aria-label="Instagram"><InstagramIcon /></a>
                <a href="https://www.linkedin.com/company/elysianstudios/" target="_blank" rel="noopener" aria-label="LinkedIn"><LinkedInIcon /></a>
              </div>
            </div>
          </div>

          <form className={`${styles.form} contact-reveal`} onSubmit={onSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Your name</label>
              <input className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Your email</label>
              <input type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Reason</label>
              <select className={styles.input} value={reason} onChange={e => setReason(e.target.value)}>
                {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Message</label>
              <textarea className={`${styles.input} ${styles.textarea}`} rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us a little…" required />
            </div>
            <button type="submit" className="btn btn-primary">
              <Send size={15} /> Send message
            </button>
            <p className={styles.note}>This opens your email app with the message ready to send.</p>
          </form>
        </div>
      </section>
    </div>
  )
}
