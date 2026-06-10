import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import styles from '../styles/About.module.css'

export default function About() {
  useEffect(() => {
    gsap.fromTo('.about-reveal',
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.15, duration: 0.9, ease: 'power3.out', delay: 0.1 }
    )
  }, [])

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="grain-overlay" />
        <div className={styles.inner}>
          <span className={`section-label about-reveal`}>About Elysian</span>
          <h1 className={`${styles.title} about-reveal`}>
            Where remarkable lives<br /><em>light the way.</em>
          </h1>
          <div className={`${styles.divider} about-reveal`} />

          <div className={styles.body}>
            <p className="about-reveal">
              We offer a glimpse into the incredible lives of the world's most extraordinary
              human beings. Through the power of storytelling and technology, we bring you closer
              to the heart of remarkable journeys and timeless experiences.
            </p>
            <p className="about-reveal">
              Through our experiences, we celebrate the beauty of human potential and the stories
              that shape our world. Together, we push the boundaries of creativity and innovation
              to share the voices and visions that must be remembered.
            </p>
            <p className="about-reveal">
              We want these exceptional individuals to serve as torchbearers for anyone seeking
              guidance, courage, or purpose in their own journey. Through Elysian, we hope to honor
              their legacy and light the way for the world.
            </p>
          </div>

          <div className={`${styles.actions} about-reveal`}>
            <Link to="/archive" className="btn btn-primary">Explore the Archive</Link>
            <Link to="/team" className="btn btn-ghost">Meet the Team</Link>
          </div>
        </div>
        <div className={styles.bgText} aria-hidden="true">ELYSIAN</div>
      </section>
    </div>
  )
}
