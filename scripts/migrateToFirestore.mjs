/**
 * One-time migration: src/data/posts.json  ->  Firestore.
 * Run locally AFTER you've filled src/lib/firebase.js with your project config
 * and created your admin user in Firebase Auth.
 *
 *   PowerShell:
 *     $env:FB_ADMIN_EMAIL    = "you@example.com"
 *     $env:FB_ADMIN_PASSWORD = "your-admin-password"
 *     node scripts/migrateToFirestore.mjs
 *
 *   Bash:
 *     FB_ADMIN_EMAIL=you@example.com FB_ADMIN_PASSWORD=... node scripts/migrateToFirestore.mjs
 *
 * It signs in as the admin (so the writes pass the security rules), then writes
 * one document per post, keyed by the post's existing numeric id. Re-runnable:
 * it overwrites, so running twice is safe.
 */
import fs from 'fs'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { writeBatch, doc } from 'firebase/firestore'
import { db, auth, POSTS_COLLECTION } from '../src/lib/firebase.js'

const EMAIL = process.env.FB_ADMIN_EMAIL
const PASSWORD = process.env.FB_ADMIN_PASSWORD
if (!EMAIL || !PASSWORD) {
  console.error('Set FB_ADMIN_EMAIL and FB_ADMIN_PASSWORD in the environment first.')
  process.exit(1)
}

const posts = JSON.parse(fs.readFileSync('src/data/posts.json', 'utf8'))

await signInWithEmailAndPassword(auth, EMAIL, PASSWORD)
console.log(`Signed in as ${EMAIL}. Importing ${posts.length} posts…`)

// Firestore batches are capped at 500 ops; chunk to be safe.
let written = 0
for (let i = 0; i < posts.length; i += 400) {
  const batch = writeBatch(db)
  for (const p of posts.slice(i, i + 400)) {
    batch.set(doc(db, POSTS_COLLECTION, String(p.id)), p)
  }
  await batch.commit()
  written += Math.min(400, posts.length - i)
  console.log(`  committed ${written}/${posts.length}`)
}

console.log('✅ Migration complete. Posts are now in Firestore.')
process.exit(0)
