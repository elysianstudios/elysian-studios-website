import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { personName } from '../utils/postMeta'
import styles from '../styles/PostCard.module.css'

const PLACEHOLDER = 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80'

export default function PostCard({ post, variant = 'default', style }) {
  const image = post.image || PLACEHOLDER
  const primaryCat = post.categories?.[0] || 'Elysian'
  const person = personName(post)

  return (
    <Link
      to={`/read/${post.slug}`}
      className={`${styles.card} ${styles[variant]}`}
      style={style}
    >
      <div className={styles.imageWrap}>
        <img
          src={image}
          alt={post.title}
          className={styles.image}
          loading="lazy"
          onError={e => { e.target.src = PLACEHOLDER }}
        />
        <div className={styles.overlay} />
        <span className={`tag ${styles.catTag}`}>{primaryCat}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{post.title}</h3>
        {variant !== 'compact' && (
          <p className={styles.excerpt}>{post.excerpt?.substring(0, 130)}…</p>
        )}
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            {person || primaryCat}
          </span>
          <span className={styles.readMore}>
            Read <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}
