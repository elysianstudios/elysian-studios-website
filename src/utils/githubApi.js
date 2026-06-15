/**
 * GitHub API helpers for the Admin panel.
 * The user's PAT is stored only in sessionStorage — never committed.
 */

const REPO_OWNER = 'elysianstudios'
const REPO_NAME  = 'elysian-studios-website'
const FILE_PATH  = 'src/data/posts.json'
const BRANCH     = 'main'
const API_BASE   = 'https://api.github.com'

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

// base64 (Latin-1 bytes) → UTF-8 string. Mirror of the write encoder
// `btoa(unescape(encodeURIComponent(s)))`. Using bare atob() here would
// mis-decode multibyte chars (— … ' etc.) into mojibake.
function decodeBase64Utf8(b64) {
  return decodeURIComponent(escape(atob(b64)))
}

// UTF-8 string → base64 (Latin-1 bytes) for the GitHub contents API.
function encodeBase64Utf8(str) {
  return btoa(unescape(encodeURIComponent(str)))
}

// Read the file's current sha without decoding its (large) content.
async function fetchSha(token) {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data.sha
}

export async function fetchPostsFile(token) {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  const content = JSON.parse(decodeBase64Utf8(data.content.replace(/\n/g, '')))
  return { posts: content, sha: data.sha }
}

async function putFile(token, encoded, sha, message) {
  return fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
    {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        message: message || `docs: update posts.json via admin panel`,
        content: encoded,
        sha,
        branch: BRANCH,
      }),
    }
  )
}

export async function writePostsFile(token, posts, sha, message) {
  // Guard against accidentally wiping the file with a bad payload.
  if (!Array.isArray(posts) || posts.length === 0) {
    throw new Error('Refusing to save: posts must be a non-empty array.')
  }
  const encoded = encodeBase64Utf8(JSON.stringify(posts, null, 2))

  let res = await putFile(token, encoded, sha, message)

  // Stale-SHA conflict (file changed since we loaded it — e.g. another
  // admin save). Re-fetch the latest sha and retry the write once.
  if (res.status === 409 || res.status === 422) {
    try {
      const freshSha = await fetchSha(token)
      res = await putFile(token, encoded, freshSha, message)
    } catch { /* fall through to the error handling below */ }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `GitHub write error: ${res.status}`)
  }
  return res.json()
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}
