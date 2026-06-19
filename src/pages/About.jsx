import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import styles from '../styles/About.module.css'

const LETTER = [
  'Thank you for being here.',
  'Every generation inherits a treasure far greater than wealth, power, or technology — the lives of extraordinary men and women who dared to dream, create, lead, sacrifice, and persevere.',
  'Their stories have shaped civilizations, inspired movements, expanded human understanding, and illuminated what is possible when courage meets conviction.',
  'Yet time has a way of reducing remarkable lives to a few dates, achievements, or quotations. The struggles are forgotten. The doubts are overlooked. The humanity behind the legend slowly fades.',
  'Elysian was born from a simple belief: that the stories of exceptional individuals deserve to be experienced, not merely remembered.',
  "Through storytelling and technology, we seek to bring you closer to the hearts and minds of history's most remarkable people.",
  'Beyond the headlines and accomplishments, we explore the journeys that defined them — the challenges they faced, the choices they made, the values they lived by, and the legacies they left behind.',
  'These are not merely stories about greatness. They are stories about possibility.',
  'Within every extraordinary life lies a lesson for ordinary moments: the courage to continue when the path is uncertain, the vision to imagine what others cannot see, the resilience to overcome failure, and the determination to pursue a purpose larger than oneself.',
  "We believe that the world's greatest leaders, thinkers, creators, explorers, innovators, and humanitarians can continue to guide us long after their time has passed.",
  'Their experiences become lanterns for those searching for direction. Their wisdom becomes a companion for those facing adversity. Their lives remind us that history is not made by perfect people, but by individuals who chose to rise above their limitations.',
  'Our mission is to preserve these voices, celebrate their contributions, and share their journeys with a new generation.',
  'By combining creativity, technology, and thoughtful storytelling, we hope to make these timeless stories more accessible, engaging, and meaningful than ever before.',
  'As you explore Elysian, we invite you to do more than learn about extraordinary people. We invite you to discover the ideas that inspired them, the principles that guided them, and the possibilities they reveal within all of us.',
  'May these stories encourage you to think more deeply, dream more boldly, and live more purposefully.',
  'Thank you for joining us on this journey.',
]

const TESTIMONIALS = [
  {
    quote: 'It’s more than just a tribute — a living archive of wisdom, built to guide and uplift anyone seeking inspiration, courage, or purpose.',
    source: 'The CIO Media',
    url: 'https://theciomedia.com/arvind-ghorwal-building-a-bridge-between-wisdom-and-innovation/',
  },
  {
    quote: 'Team Elysian loves what they do. When you put your heart and soul into your work, you can create magic — and that is exactly what Elysian is trying to do.',
    source: 'Humans of Globe',
    url: 'https://humansofglobe.com/elyson-studios-taking-you-on-a-spiritual-odyssey/',
  },
  {
    quote: 'Elysian Studios’ films have not only captured the hearts of viewers worldwide but have also garnered acclaim in prestigious international arenas.',
    source: 'The Fortune Leader',
    url: 'https://thefortuneleader.com/elysian-studios/',
  },
  {
    quote: 'Arvind’s quest has been filled with numerous obstacles, but he did not give up — establishing Elysian Studios among the leading storytelling ventures.',
    source: 'Mirror Review',
    url: 'https://www.mirrorreview.com/arvind-ghorwal-elysian-studios/',
  },
  {
    quote: 'A founder who started from scratch and kept the entrepreneurial journey going — seeking wisdom on leadership and purpose at every turn.',
    source: 'The USA Leaders',
    url: 'https://theusaleaders.com/industry-leaders/arvind-ghorwal/',
  },
]

export default function About() {
  useEffect(() => {
    gsap.fromTo('.about-reveal',
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.04, duration: 0.8, ease: 'power3.out', delay: 0.1 }
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
            <p className={`${styles.greeting} about-reveal`}>Dear Reader,</p>
            {LETTER.map((para, i) => (
              <p key={i} className="about-reveal">{para}</p>
            ))}
            <p className={`${styles.signOff} about-reveal`}>
              With gratitude,<br />
              <span className={styles.signName}>The Elysian Team</span>
            </p>
          </div>

          <div className={`${styles.actions} about-reveal`}>
            <Link to="/archive" className="btn btn-primary">Explore the Archive</Link>
            <Link to="/team" className="btn btn-ghost">Meet the Team</Link>
          </div>
        </div>
      </section>

      {/* Testimonials / Press */}
      <section className={styles.press}>
        <div className={styles.pressInner}>
          <span className="section-label">In the Press</span>
          <h2 className={styles.pressTitle}>What the world is saying</h2>
          <div className={styles.pressGrid}>
            {TESTIMONIALS.map(t => (
              <a
                key={t.source}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.testimonial}
              >
                <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
                <blockquote className={styles.testimonialQuote}>{t.quote}</blockquote>
                <span className={styles.testimonialSource}>{t.source} &rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
