/**
 * Enrich src/data/posts.json so the "database" is comprehensive and
 * self-contained — every field we might need in future is stored on the
 * post rather than derived at render time. Run AFTER the Cloudinary
 * migration so URLs are final:  node scripts/enrichPosts.mjs
 *
 * Adds / normalizes per post:
 *   - person      : the subject's display name (explicit, no longer only derived)
 *   - image       : featured image (first of any legacy "a|b" list)
 *   - gallery      : de-duped list of every image URL used in the post
 *   - readTime     : estimated minutes (kept if present, else computed)
 *   - wordCount    : plain-text word count of the content
 *   - categories/tags : guaranteed arrays
 *   - updatedAt    : ISO date of this enrichment pass
 * Field order is normalized for readability. Nothing is removed.
 */
import fs from 'fs'

const PATH = 'src/data/posts.json'
const posts = JSON.parse(fs.readFileSync(PATH, 'utf8'))

function firstImageUrl(image) {
  if (!image) return ''
  return image.split('|')[0].trim()
}
function personFromImage(image) {
  const url = firstImageUrl(image)
  if (!url) return ''
  let file = url.split('/').pop().split('?')[0]
  file = file.replace(/\.(png|jpe?g|webp|gif|svg|avif)$/i, '')
  file = file
    .replace(/[-_]?scaled$/i, '')
    .replace(/-\d+x\d+$/i, '')        // WP size suffix -1024x660
    .replace(/[-_]\d+$/, '')           // trailing -1 / _2
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!/[a-z]/i.test(file)) return ''
  return file.replace(/\s+/g, ' ')
}
function imagesInContent(html) {
  const out = []
  const re = /<img[^>]+src="([^"]+)"/g
  let m
  while ((m = re.exec(html || ''))) out.push(m[1])
  return out
}
function plainText(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
}

const today = new Date().toISOString().split('T')[0]

const enriched = posts.map(p => {
  const image = firstImageUrl(p.image)
  const person = (p.person && p.person.trim()) || personFromImage(image)
  const gallery = [...new Set([image, ...imagesInContent(p.content)].filter(Boolean))]
  const words = plainText(p.content).trim().split(/\s+/).filter(Boolean).length
  const readTime = p.readTime || Math.max(1, Math.round(words / 200))

  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    person,
    excerpt: p.excerpt || '',
    image,
    gallery,
    categories: Array.isArray(p.categories) ? p.categories : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    author: p.author || 'Elysian Studios',
    date: p.date,
    readTime,
    wordCount: words,
    updatedAt: today,
    content: p.content || '',
  }
})

// Guarantee unique slugs (the admin can accidentally create duplicates).
// First occurrence keeps the clean slug; later ones get -2, -3, …
const usedSlugs = new Set()
for (const p of enriched) {
  let base = p.slug || 'post'
  let slug = base, n = 2
  while (usedSlugs.has(slug)) slug = `${base}-${n++}`
  usedSlugs.add(slug)
  p.slug = slug
}

fs.writeFileSync(PATH, JSON.stringify(enriched, null, 2) + '\n')

const withPerson = enriched.filter(p => p.person).length
const imgs = enriched.reduce((n, p) => n + p.gallery.length, 0)
console.log(`Enriched ${enriched.length} posts.`)
console.log(`  with a person name: ${withPerson}`)
console.log(`  total images in galleries: ${imgs}`)
console.log(`  still pointing at old host: ${enriched.filter(p => /elysian\.studio\/wp-content/.test(p.content) || /elysian\.studio\/wp-content/.test(p.image)).length}`)
