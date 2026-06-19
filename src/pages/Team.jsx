import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MessageCircle, Link2, Globe, Mail } from 'lucide-react'
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
              <span className={styles.statNum}>6</span>
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
                  <img
                    src={member.image}
                    alt={member.name}
                    className={styles.cardImg}
                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' }}
                  />
                  <div className={styles.cardImgOverlay} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.name}>{member.name}</h3>
                    <span className={styles.role}>{member.role}</span>
                  </div>
                  <p className={styles.bio}>{member.bio}</p>
                  <div className={styles.socials}>
                    {member.social?.twitter && (
                      <a href={member.social.twitter} target="_blank" rel="noopener" aria-label="Twitter / X">
                        <MessageCircle size={15} />
                      </a>
                    )}
                    {member.social?.linkedin && (
                      <a href={member.social.linkedin} target="_blank" rel="noopener" aria-label="LinkedIn">
                        <Link2 size={15} />
                      </a>
                    )}
                    {member.social?.website && (
                      <a href={member.social.website} target="_blank" rel="noopener" aria-label="Website">
                        <Globe size={15} />
                      </a>
                    )}
                    {member.social?.email && (
                      <a href={`mailto:${member.social.email}`} aria-label="Email">
                        <Mail size={15} />
                      </a>
                    )}
                  </div>
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
