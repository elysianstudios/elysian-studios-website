import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const LinkedInIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const initials = (name) => name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
import team from '../data/team.json'
import teamIllustration from '../images/team-illustration.png'
import styles from '../styles/Team.module.css'

gsap.registerPlugin(ScrollTrigger)

export default function Team() {
  useEffect(() => {
    gsap.fromTo('.team-hero-line',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.1 }
    )
    gsap.fromTo('.team-card',
      { y: 40, opacity: 0, scale: 0.97 },
      {
        y: 0, opacity: 1, scale: 1,
        stagger: 0.12, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.team-grid', start: 'top 80%' }
      }
    )
    return () => ScrollTrigger.getAll().forEach(t => t.kill())
  }, [])

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="grain-overlay" />
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={`section-label team-hero-line`}>Our Team</span>
            <h1 className={`${styles.heroTitle} team-hero-line`}>
              The Minds<br /><em>Behind Elysian</em>
            </h1>
            <div className={`${styles.heroSubWrap} team-hero-line`}>
              <div className="divider" />
              <p className={styles.heroSub}>
                Writers, researchers, designers, dreamers — all here for the same reason:
                beautiful stories don't tell themselves.
              </p>
            </div>
          </div>
          <div className={`${styles.heroArt} team-hero-line`}>
            <img src={teamIllustration} alt="The Elysian editorial team at work" />
          </div>
        </div>
      </section>

      {/* Mission strip */}
      <div className={styles.missionStrip}>
        <div className="container">
          <div className={styles.missionInner}>
            <div className={styles.missionStat}>
              <span className={styles.statNum}>89+</span>
              <span className={styles.statLabel}>Chronicles Published</span>
            </div>
            <div className={styles.missionDivider} />
            <div className={styles.missionStat}>
              <span className={styles.statNum}>5</span>
              <span className={styles.statLabel}>Editorial Voices</span>
            </div>
            <div className={styles.missionDivider} />
            <div className={styles.missionStat}>
              <span className={styles.statNum}>∞</span>
              <span className={styles.statLabel}>Stories Yet to Tell</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team grid */}
      <section className={styles.grid}>
        <div className="container">
          <div className={`${styles.teamGrid} team-grid`}>
            {team.map(member => (
              <article key={member.id} className={`${styles.card} team-card`}>
                <div className={styles.cardImgWrap}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} className={styles.cardImg} />
                  ) : (
                    <div className={styles.monogram} aria-hidden="true">{initials(member.name)}</div>
                  )}
                  <div className={styles.cardImgOverlay} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.name}>{member.name}</h3>
                    <span className={styles.role}>{member.role}</span>
                  </div>
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.linkedinLink}
                    >
                      <LinkedInIcon /> LinkedIn
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Join section */}
      <section className={styles.joinSection}>
        <div className={`container ${styles.joinInner}`}>
          <span className="section-label">Write for Elysian</span>
          <h2 className={styles.joinTitle}>Have a story<br /><em>worth telling?</em></h2>
          <p className={styles.joinText}>
            We're always looking for writers and researchers who believe
            a great life deserves a great telling.
          </p>
          <Link to="/contact" className="btn btn-primary">
            Get in Touch
          </Link>
        </div>
      </section>
    </div>
  )
}
