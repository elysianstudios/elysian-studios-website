import DOMPurify from 'dompurify'

// Hosts allowed for <iframe> embeds. Anything else is dropped.
const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
])

let hookRegistered = false
function registerHook() {
  if (hookRegistered) return
  // Drop iframes whose src isn't an allow-listed embed host.
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return
    const src = node.getAttribute?.('src') || ''
    let host = ''
    try { host = new URL(src, window.location.href).hostname } catch { host = '' }
    if (!ALLOWED_IFRAME_HOSTS.has(host)) {
      node.parentNode?.removeChild(node)
    }
  })
  hookRegistered = true
}

const CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'figure',
    'figcaption', 'hr', 'span', 'div', 'table', 'thead', 'tbody', 'tr',
    'th', 'td',
    // media
    'iframe', 'video', 'audio', 'source',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel',
    // media
    'allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy',
    'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'poster',
    'width', 'height', 'type',
  ],
  // iframes carry their own origin frame; this is required so DOMPurify
  // keeps them at all (combined with the host allow-list hook above).
  ADD_TAGS: ['iframe'],
  FORCE_BODY: true,
}

// Sanitize post HTML for rendering. Allows safe YouTube/Vimeo iframe
// embeds and native <video>/<audio>; everything else is the usual
// editorial-HTML subset. Shared by the Reader and the admin preview so
// what you preview is exactly what ships.
export function sanitize(html) {
  registerHook()
  return DOMPurify.sanitize(html, CONFIG)
}
