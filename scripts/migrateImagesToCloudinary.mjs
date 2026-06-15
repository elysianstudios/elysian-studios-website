/**
 * ============================================================
 * One-time migration: WordPress images  ->  your Cloudinary
 * ============================================================
 * Copies every image referenced in src/data/posts.json off the old
 * WordPress host and into YOUR Cloudinary account, then rewrites the
 * posts to point at optimized Cloudinary URLs (f_auto,q_auto).
 *
 * SECURITY: your API secret is read from the environment — it is NEVER
 * written to a file or committed. Run this on your own machine only.
 *
 * ------------------------------------------------------------
 * HOW TO RUN  (PowerShell, from the project root)
 * ------------------------------------------------------------
 *   $env:CLOUDINARY_CLOUD_NAME = "ddpq9ziwk"
 *   $env:CLOUDINARY_API_KEY    = "423417495555898"
 *   $env:CLOUDINARY_API_SECRET = "<your real api secret>"
 *   node scripts/migrateImagesToCloudinary.mjs
 *
 * (Bash:  CLOUDINARY_API_SECRET=... node scripts/migrateImagesToCloudinary.mjs)
 *
 * It is resumable: progress is cached in scripts/.cloudinary-map.json,
 * so re-running skips already-uploaded images. When it finishes,
 * src/data/posts.json is updated in place — review the diff, then
 * commit & push.
 * ============================================================
 */
import fs from 'fs'
import crypto from 'crypto'
import path from 'path'

const CLOUD  = process.env.CLOUDINARY_CLOUD_NAME || 'ddpq9ziwk'
const KEY    = process.env.CLOUDINARY_API_KEY
const SECRET = process.env.CLOUDINARY_API_SECRET
const FOLDER = 'elysian'

if (!KEY || !SECRET) {
  console.error('Missing CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in the environment. See the header of this file.')
  process.exit(1)
}

const POSTS_PATH = 'src/data/posts.json'
const MAP_PATH   = 'scripts/.cloudinary-map.json'

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'))
const map = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf8')) : {}

// ── Collect every unique image URL (featured + inline <img>) ──────────
function collectUrls() {
  const urls = new Set()
  for (const p of posts) {
    if (p.image) p.image.split('|').forEach(u => u.trim() && urls.add(u.trim()))
    const re = /<img[^>]+src="([^"]+)"/g
    let m
    while ((m = re.exec(p.content || ''))) urls.add(m[1])
  }
  return [...urls]
}

// Already a Cloudinary URL? leave it alone.
const isCloudinary = (u) => /res\.cloudinary\.com/.test(u)

// Deterministic, readable public id from the source path.
function publicIdFor(url) {
  try {
    const u = new URL(url)
    let p = u.pathname.replace(/^\/+/, '')
    const i = p.indexOf('uploads/')
    if (i !== -1) p = p.slice(i + 'uploads/'.length)
    p = p.replace(/\.[a-z0-9]+$/i, '')          // drop extension
    p = p.replace(/[^a-zA-Z0-9/_-]+/g, '-')      // safe chars
    return p
  } catch {
    return crypto.createHash('sha1').update(url).digest('hex').slice(0, 16)
  }
}

// ── Signed remote-fetch upload to Cloudinary ──────────────────────────
async function upload(url) {
  const timestamp = Math.floor(Date.now() / 1000)
  const public_id = publicIdFor(url)
  // Params to sign (everything except file, api_key, resource_type, cloud_name),
  // sorted alphabetically, then api_secret appended → sha1 hex.
  const toSign = { folder: FOLDER, overwrite: 'true', public_id, timestamp, unique_filename: 'false' }
  const signature = crypto.createHash('sha1')
    .update(Object.keys(toSign).sort().map(k => `${k}=${toSign[k]}`).join('&') + SECRET)
    .digest('hex')

  const fd = new FormData()
  fd.append('file', url)                 // Cloudinary fetches the remote URL itself
  fd.append('api_key', KEY)
  fd.append('timestamp', String(timestamp))
  fd.append('public_id', public_id)
  fd.append('folder', FOLDER)
  fd.append('overwrite', 'true')
  fd.append('unique_filename', 'false')
  fd.append('signature', signature)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  // Optimized delivery URL: automatic format + quality.
  return data.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
}

// ── Run ───────────────────────────────────────────────────────────────
const urls = collectUrls().filter(u => !isCloudinary(u))
console.log(`Found ${urls.length} non-Cloudinary image URLs to migrate.`)

let done = 0, failed = []
for (const url of urls) {
  if (map[url]) { done++; continue }            // resume
  try {
    map[url] = await upload(url)
    fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2))
    done++
    console.log(`✓ ${done}/${urls.length}  ${url.slice(0, 70)}`)
  } catch (e) {
    failed.push({ url, error: String(e.message || e) })
    console.warn(`✗ ${url}\n   ${e.message || e}`)
  }
}

// ── Rewrite posts.json using the map ──────────────────────────────────
let replaced = 0
const swap = (s) => {
  if (!s) return s
  for (const [from, to] of Object.entries(map)) {
    if (s.includes(from)) { s = s.split(from).join(to); replaced++ }
  }
  return s
}
for (const p of posts) {
  if (p.image) p.image = p.image.split('|').map(u => map[u.trim()] || u.trim()).join('|')
  if (p.content) p.content = swap(p.content)
}
fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2) + '\n')

console.log(`\nDone. Uploaded/cached ${done}/${urls.length}. URL replacements in posts: ${replaced}.`)
if (failed.length) {
  console.log(`\n${failed.length} failed (left pointing at the original URL):`)
  failed.forEach(f => console.log('  ' + f.url))
}
console.log('\nReview the diff in src/data/posts.json, then commit & push.')
