// Helpers for deriving display metadata from a post.

// Some legacy image fields hold several URLs joined by "|"; the first is
// the featured image. Defensive even though the data was migrated.
export function firstImageUrl(image) {
  if (!image) return ''
  return image.split('|')[0].trim()
}

// Derive the subject's name from the featured image filename
// (e.g. ".../Dr.-Jane-Goodall-1.png" -> "Dr. Jane Goodall").
// Used as a fallback when a post has no explicit `person` field.
export function personFromImage(image) {
  const url = firstImageUrl(image)
  if (!url) return ''
  let file = url.split('/').pop().split('?')[0]
  file = file.replace(/\.(png|jpe?g|webp|gif|svg|avif)$/i, '')
  file = file
    .replace(/[-_]?scaled$/i, '')
    .replace(/[-_]\d+$/, '')        // trailing -1, _2
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!/[a-z]/i.test(file)) return '' // not a name (digits/junk)
  return file.replace(/\s+/g, ' ')
}

// The display name for a post: explicit `person` wins, else derived.
export function personName(post) {
  return (post?.person && post.person.trim()) || personFromImage(post?.image)
}
