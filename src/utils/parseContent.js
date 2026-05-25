/**
 * Strip WordPress block comments and normalize HTML for rendering.
 * DOMPurify sanitization is applied separately in Reader.jsx.
 */
export function parseContent(html) {
  if (!html) return ''
  return html
    .replace(/<!-- wp:[^>]+?-->/g, '')
    .replace(/<!-- \/wp:[^>]+?-->/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .trim()
}

export function estimateReadTime(html) {
  const words = html.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
