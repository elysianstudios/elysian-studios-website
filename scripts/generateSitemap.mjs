/**
 * Generate public/sitemap.xml from the live Firestore posts + the main pages.
 * Re-run whenever you add/remove a lot of posts:  node scripts/generateSitemap.mjs
 *
 * SITE_ORIGIN must match where the site is actually hosted (no trailing slash).
 */
import fs from 'fs'
import { collection, getDocs } from 'firebase/firestore'
import { db, POSTS_COLLECTION } from '../src/lib/firebase.js'

const SITE_ORIGIN = process.env.SITE_ORIGIN || 'https://elysianstudios.com'
const today = new Date().toISOString().split('T')[0]

const staticPaths = ['/', '/archive', '/about', '/team', '/contact']

const snap = await getDocs(collection(db, POSTS_COLLECTION))
const posts = snap.docs.map(d => d.data()).filter(p => p.slug)

const urls = [
  ...staticPaths.map(p => ({ loc: SITE_ORIGIN + p, lastmod: today, priority: p === '/' ? '1.0' : '0.7' })),
  ...posts.map(p => ({
    loc: `${SITE_ORIGIN}/read/${p.slug}`,
    lastmod: (p.updatedAt || p.date || today),
    priority: '0.8',
  })),
]

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u =>
    `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`
  ).join('\n') +
  '\n</urlset>\n'

fs.writeFileSync('public/sitemap.xml', xml)
console.log(`Wrote public/sitemap.xml — ${urls.length} URLs (${posts.length} posts) at ${SITE_ORIGIN}`)
process.exit(0)
