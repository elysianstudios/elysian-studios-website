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

export async function fetchPostsFile(token) {
  const res = await fetch(
    `${API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
    { headers: headers(token) }
  )
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  const content = JSON.parse(atob(data.content.replace(/\n/g, '')))
  return { posts: content, sha: data.sha }
}

export async function writePostsFile(token, posts, sha, message) {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))))
  const res = await fetch(
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
