import { useState, useEffect } from 'react'
import { Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Lock, LogOut, AlertCircle } from 'lucide-react'
import { fetchPostsFile, writePostsFile, slugify } from '../utils/githubApi'
import styles from '../styles/Admin.module.css'

/* ── SHA-256 password gate ─────────────────────────────────── */
const ADMIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // sha256('admin') — CHANGE THIS

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function EmptyPost() {
  return {
    id: Date.now(),
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    image: '',
    author: 'Elysian Studios',
    readTime: 5,
    categories: [],
    tags: [],
  }
}

export default function Admin() {
  const [authed,    setAuthed]    = useState(() => sessionStorage.getItem('elysian-admin') === '1')
  const [password,  setPassword]  = useState('')
  const [pwError,   setPwError]   = useState('')
  const [showPw,    setShowPw]    = useState(false)

  const [token,     setToken]     = useState(() => sessionStorage.getItem('elysian-gh-token') || '')
  const [showToken, setShowToken] = useState(false)

  const [posts,     setPosts]     = useState([])
  const [sha,       setSha]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  const [view,      setView]      = useState('list') // 'list' | 'new' | 'edit'
  const [editPost,  setEditPost]  = useState(null)
  const [catInput,  setCatInput]  = useState('')
  const [tagInput,  setTagInput]  = useState('')

  const [search,    setSearch]    = useState('')
  const [deleteId,  setDeleteId]  = useState(null)

  /* ── Auth ──────────────────────────────────────────────────── */
  const login = async (e) => {
    e.preventDefault()
    const hash = await sha256(password)
    if (hash === ADMIN_HASH) {
      sessionStorage.setItem('elysian-admin', '1')
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Incorrect password.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('elysian-admin')
    sessionStorage.removeItem('elysian-gh-token')
    setAuthed(false)
    setToken('')
    setPosts([])
  }

  /* ── Load from GitHub ──────────────────────────────────────── */
  const loadPosts = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const { posts: p, sha: s } = await fetchPostsFile(token)
      setPosts(p)
      setSha(s)
      sessionStorage.setItem('elysian-gh-token', token)
    } catch (e) {
      setError('Could not fetch posts: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Save to GitHub ────────────────────────────────────────── */
  const savePosts = async (newPosts, msg) => {
    if (!token || !sha) { setError('No GitHub token or SHA — load posts first.'); return false }
    setSaving(true)
    setError('')
    try {
      const result = await writePostsFile(token, newPosts, sha, msg)
      setSha(result.content.sha)
      setSuccess('Saved successfully to GitHub!')
      setTimeout(() => setSuccess(''), 4000)
      return true
    } catch (e) {
      setError('Save failed: ' + e.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  /* ── New / Edit post ───────────────────────────────────────── */
  const openNew = () => {
    setEditPost(EmptyPost())
    setCatInput('')
    setTagInput('')
    setView('new')
  }

  const openEdit = (post) => {
    setEditPost({ ...post })
    setCatInput(post.categories?.join(', ') || '')
    setTagInput(post.tags?.join(', ') || '')
    setView('edit')
  }

  const saveEdit = async () => {
    if (!editPost.title.trim()) { setError('Title is required.'); return }
    const slug = editPost.slug || slugify(editPost.title)
    const post = {
      ...editPost,
      slug,
      categories: catInput.split(',').map(c => c.trim()).filter(Boolean),
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
    }
    let updated
    if (view === 'new') {
      updated = [post, ...posts]
    } else {
      updated = posts.map(p => p.id === post.id ? post : p)
    }
    const ok = await savePosts(updated, `${view === 'new' ? 'add' : 'update'}: ${post.title}`)
    if (ok) {
      setPosts(updated)
      setView('list')
      setEditPost(null)
    }
  }

  const confirmDelete = async () => {
    const updated = posts.filter(p => p.id !== deleteId)
    const ok = await savePosts(updated, `remove: post #${deleteId}`)
    if (ok) {
      setPosts(updated)
      setDeleteId(null)
    }
  }

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.categories?.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  /* ── Login screen ──────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>
            <Lock size={24} />
            <span>ELYSIAN ADMIN</span>
          </div>
          <p className={styles.loginSub}>This area is restricted.</p>
          <form onSubmit={login} className={styles.loginForm}>
            <div className={styles.inputWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                className={styles.input}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <p className={styles.errorMsg}><AlertCircle size={14} /> {pwError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Main admin ────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Admin Panel</h1>
          <p className={styles.pageSubtitle}>Manage Elysian chronicles via GitHub</p>
        </div>
        <button className={styles.logoutBtn} onClick={logout}>
          <LogOut size={15} /> Logout
        </button>
      </div>

      {/* GitHub token */}
      {!posts.length && (
        <div className={styles.tokenSection}>
          <p className={styles.tokenLabel}>GitHub Personal Access Token (contents:write scope)</p>
          <div className={styles.tokenRow}>
            <div className={styles.inputWrap} style={{ flex: 1 }}>
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                className={styles.input}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowToken(v => !v)}>
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button className="btn btn-primary" onClick={loadPosts} disabled={!token || loading}>
              {loading ? 'Loading…' : 'Load Posts'}
            </button>
          </div>
          <p className={styles.tokenHint}>
            Token is stored in sessionStorage only — cleared when you close the tab.
          </p>
        </div>
      )}

      {error   && <p className={styles.errorBanner}><AlertCircle size={14} /> {error}</p>}
      {success && <p className={styles.successBanner}>{success}</p>}

      {/* List view */}
      {view === 'list' && posts.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <input
              type="search"
              placeholder="Search posts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={15} /> New Post
            </button>
          </div>
          <p className={styles.postCount}>{filteredPosts.length} posts</p>
          <div className={styles.table}>
            {filteredPosts.map(post => (
              <div key={post.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>{post.title}</p>
                  <div className={styles.rowMeta}>
                    <span>{post.date?.split('T')[0]}</span>
                    {post.categories?.slice(0, 2).map(c => (
                      <span key={c} className="tag">{c}</span>
                    ))}
                    <span>{post.readTime || 5} min</span>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(post)} aria-label="Edit">
                    <Edit2 size={14} />
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteId(post.id)} aria-label="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New / Edit form */}
      {(view === 'new' || view === 'edit') && editPost && (
        <div className={styles.form}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{view === 'new' ? 'New Chronicle' : 'Edit Chronicle'}</h2>
            <button className={styles.cancelBtn} onClick={() => setView('list')}>
              <X size={16} /> Cancel
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Title *</label>
              <input
                className={styles.input}
                value={editPost.title}
                onChange={e => setEditPost(p => ({
                  ...p,
                  title: e.target.value,
                  slug: p.slug || slugify(e.target.value)
                }))}
                placeholder="Title of the chronicle"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Slug</label>
              <input
                className={styles.input}
                value={editPost.slug}
                onChange={e => setEditPost(p => ({ ...p, slug: slugify(e.target.value) }))}
                placeholder="auto-generated"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Author</label>
              <input
                className={styles.input}
                value={editPost.author}
                onChange={e => setEditPost(p => ({ ...p, author: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                className={styles.input}
                value={editPost.date?.split('T')[0] || ''}
                onChange={e => setEditPost(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Read Time (min)</label>
              <input
                type="number"
                min="1"
                className={styles.input}
                value={editPost.readTime}
                onChange={e => setEditPost(p => ({ ...p, readTime: parseInt(e.target.value) || 5 }))}
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Featured Image URL</label>
              <input
                className={styles.input}
                value={editPost.image}
                onChange={e => setEditPost(p => ({ ...p, image: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Categories (comma-separated)</label>
              <input
                className={styles.input}
                value={catInput}
                onChange={e => setCatInput(e.target.value)}
                placeholder="Philosophy, Science"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tags (comma-separated)</label>
              <input
                className={styles.input}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="wisdom, history"
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Excerpt</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                value={editPost.excerpt}
                onChange={e => setEditPost(p => ({ ...p, excerpt: e.target.value }))}
                placeholder="A short summary shown in card previews…"
              />
            </div>
            <div className={styles.formGroupFull}>
              <label className={styles.label}>Content (HTML)</label>
              <textarea
                className={`${styles.input} ${styles.textarea} ${styles.contentArea}`}
                rows={20}
                value={editPost.content}
                onChange={e => setEditPost(p => ({ ...p, content: e.target.value }))}
                placeholder="<p>Your chronicle content here…</p>"
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button className="btn btn-ghost" onClick={() => setView('list')}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : <><Save size={15} /> Save to GitHub</>}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Delete this chronicle?</h3>
            <p>This will remove the post from GitHub. This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className={`btn ${styles.dangerBtn}`}
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
