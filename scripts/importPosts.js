/**
 * One-time CSV → posts.json converter
 * Run: node scripts/importPosts.js
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_PATH = join(ROOT, 'Posts-Export-2026-May-25-0633.csv')
const OUT_PATH = join(ROOT, 'src', 'data', 'posts.json')

// Ensure data directory exists
mkdirSync(join(ROOT, 'src', 'data'), { recursive: true })

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

function stripWpBlocks(html) {
  if (!html) return ''
  return html
    .replace(/<!-- wp:[^>]+?-->/g, '')
    .replace(/<!-- \/wp:[^>]+?-->/g, '')
    .replace(/<p><\/p>/g, '')
    .trim()
}

function parseCSV(text) {
  const rows = []
  let i = 0
  const len = text.length

  while (i < len) {
    const row = []
    while (i < len && text[i] !== '\n') {
      if (text[i] === '"') {
        // Quoted field
        i++ // skip opening quote
        let field = ''
        while (i < len) {
          if (text[i] === '"' && text[i + 1] === '"') {
            field += '"'
            i += 2
          } else if (text[i] === '"') {
            i++ // skip closing quote
            break
          } else {
            field += text[i++]
          }
        }
        row.push(field)
        if (text[i] === ',') i++
      } else {
        let field = ''
        while (i < len && text[i] !== ',' && text[i] !== '\n') {
          field += text[i++]
        }
        row.push(field)
        if (text[i] === ',') i++
      }
    }
    if (text[i] === '\n') i++
    if (row.length > 1) rows.push(row)
  }
  return rows
}

const raw = readFileSync(CSV_PATH, 'utf8').replace(/^﻿/, '')
const rows = parseCSV(raw)
const headers = rows[0].map(h => h.trim())

function col(row, name) {
  const idx = headers.indexOf(name)
  return idx >= 0 ? (row[idx] || '').trim() : ''
}

const posts = []
const slugsSeen = new Set()

for (let r = 1; r < rows.length; r++) {
  const row = rows[r]
  if (!row || row.length < 5) continue

  const postType = col(row, 'Post Type')
  const status   = col(row, 'Status')
  if (postType !== 'post') continue
  if (status !== 'publish') continue

  const title   = col(row, 'Title')
  if (!title) continue

  let slug = slugify(title)
  // ensure unique
  if (slugsSeen.has(slug)) {
    slug = slug + '-' + col(row, 'ID')
  }
  slugsSeen.add(slug)

  const content  = stripWpBlocks(col(row, 'Content'))
  const excerpt  = col(row, 'Excerpt') || content.replace(/<[^>]+>/g, '').substring(0, 200) + '…'
  const date     = col(row, 'Date')
  const image    = col(row, 'Image URL') || ''
  const readTime = col(row, '_yoast_wpseo_estimated-reading-time-minutes') || '5'
  const author   = col(row, 'Author First Name')
    ? col(row, 'Author First Name') + ' ' + col(row, 'Author Last Name')
    : col(row, 'Author Username') || 'Elysian Studios'
  const categories = col(row, 'Categories')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean)
  const tags = col(row, 'Tags')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  posts.push({
    id: parseInt(col(row, 'ID')),
    title,
    slug,
    excerpt: excerpt.replace(/<[^>]+>/g, '').substring(0, 250),
    content,
    date,
    image,
    author,
    readTime: parseInt(readTime) || 5,
    categories,
    tags,
  })
}

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date))

writeFileSync(OUT_PATH, JSON.stringify(posts, null, 2))
console.log(`✓ Imported ${posts.length} published posts → src/data/posts.json`)
