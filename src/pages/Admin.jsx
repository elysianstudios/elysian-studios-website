import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Lock, LogOut, AlertCircle, FileText, Image as ImageIcon, Bold, Italic, List, Link as LinkIcon, Heading2, Heading3, Quote, Code, LayoutGrid, BookOpen, Calendar, Clock, Film } from 'lucide-react'
import { fetchPostsFile, writePostsFile, slugify } from '../utils/githubApi'
import { parseContent } from '../utils/parseContent'
import { sanitize } from '../utils/sanitizeHtml'
import { personFromImage } from '../utils/postMeta'
import localPosts from '../data/posts.json'
import styles from '../styles/Admin.module.css'

const ADMIN_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'

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
    person: '',
    author: 'Elysian Studios',
    readTime: 5,
    categories: [],
    tags: [],
  }
}

// Parse a YouTube/Vimeo URL into an embeddable iframe src. Returns '' if unrecognized.
function toEmbedSrc(url) {
  if (!url) return ''
  try {
    const u = new URL(url.trim())
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (host.endsWith('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }
  } catch { /* not a URL */ }
  return ''
}

/* ── Rich text toolbar helpers ─────────────────────────────── */
function insertAround(textarea, before, after, placeholder) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const sel = textarea.value.slice(start, end) || placeholder
  const newVal = textarea.value.slice(0, start) + before + sel + after + textarea.value.slice(end)
  return { value: newVal, cursor: start + before.length + sel.length + after.length }
}

function insertLine(textarea, prefix, placeholder) {
  const start = textarea.selectionStart
  const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1
  const before = textarea.value.slice(0, lineStart)
  const after = textarea.value.slice(lineStart)
  const line = after.split('\n')[0]
  const stripped = line.startsWith(prefix) ? line.slice(prefix.length) : prefix + (line || placeholder)
  const newVal = before + stripped + '\n' + after.slice(line.length + 1)
  return { value: newVal, cursor: lineStart + stripped.length }
}

/* ── Tag / category picker: toggle existing, add new ───────── */
function TagPicker({ options, value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const selected = value || []
  const toggle = (t) =>
    onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t])
  const add = () => {
    const t = draft.trim()
    if (t && !selected.includes(t)) onChange([...selected, t])
    setDraft('')
  }
  const allChips = [...new Set([...options, ...selected])]
  return (
    <div className={styles.tagPicker}>
      {allChips.length > 0 && (
        <div className={styles.tagChips}>
          {allChips.map(t => (
            <button
              type="button"
              key={t}
              className={`${styles.tagChip} ${selected.includes(t) ? styles.tagChipActive : ''}`}
              onClick={() => toggle(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className={styles.tagPickerAdd}>
        <input
          className={styles.input}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() } }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-ghost" onClick={add}>Add</button>
      </div>
    </div>
  )
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
  const [ghLoaded,  setGhLoaded]  = useState(false) // true once posts+sha pulled from GitHub
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')
  const [showTokenPanel, setShowTokenPanel] = useState(false)

  const [view,      setView]      = useState('list')
  const [editPost,  setEditPost]  = useState(null)
  const [preview,   setPreview]   = useState(false)
  const [activeTab, setActiveTab] = useState('content') // 'content' | 'meta' | 'preview'

  const [search,    setSearch]    = useState('')
  const [deleteId,  setDeleteId]  = useState(null)
  const [sortBy,    setSortBy]    = useState('date') // 'date' | 'title'

  const contentRef = useRef(null)

  /* ── Seed local posts on login (browse/create without a token) ── */
  useEffect(() => {
    if (authed && posts.length === 0 && !ghLoaded) {
      setPosts(localPosts)
    }
  }, [authed])

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

  /* ── Load / Save ───────────────────────────────────────────── */
  const loadPosts = async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const { posts: p, sha: s } = await fetchPostsFile(token)
      setPosts(p)
      setSha(s)
      setGhLoaded(true)
      setShowTokenPanel(false)
      sessionStorage.setItem('elysian-gh-token', token)
      setSuccess('Synced with GitHub — live data loaded.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError('Could not fetch posts: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const savePosts = async (newPosts, msg) => {
    if (!token || !sha || !ghLoaded) {
      // Local preview mode: apply to the in-memory list so the portal is
      // fully usable for testing. Changes aren't pushed until GitHub is connected.
      setError('')
      setSuccess('Updated in local preview — connect GitHub to publish this change.')
      setTimeout(() => setSuccess(''), 4500)
      return true
    }
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

  /* ── Post CRUD ─────────────────────────────────────────────── */
  const openNew = () => {
    setEditPost(EmptyPost())
    setActiveTab('content')
    setPreview(false)
    setView('new')
  }

  const openEdit = (post) => {
    setEditPost({ categories: [], tags: [], person: '', ...post })
    setActiveTab('content')
    setPreview(false)
    setView('edit')
  }

  const saveEdit = async () => {
    if (!editPost.title.trim()) { setError('Title is required.'); return }
    const slug = editPost.slug || slugify(editPost.title)
    const post = {
      ...editPost,
      slug,
      categories: editPost.categories || [],
      tags: editPost.tags || [],
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
    const id = deleteId
    const updated = posts.filter(p => p.id !== id)
    try {
      const ok = await savePosts(updated, `remove: post #${id}`)
      if (ok) {
        setPosts(updated)
        setDeleteId(null)
      }
      // on failure savePosts has set `error`; modal shows it and stays open
    } catch (e) {
      setError('Delete failed: ' + (e?.message || 'unknown error'))
    }
  }

  /* ── Rich editor toolbar ───────────────────────────────────── */
  const applyFormat = useCallback((type) => {
    const ta = contentRef.current
    if (!ta) return
    let result
    switch (type) {
      case 'bold':    result = insertAround(ta, '<strong>', '</strong>', 'bold text'); break
      case 'italic':  result = insertAround(ta, '<em>', '</em>', 'italic text'); break
      case 'h2':      result = insertAround(ta, '<h2>', '</h2>', 'Heading'); break
      case 'h3':      result = insertAround(ta, '<h3>', '</h3>', 'Sub-heading'); break
      case 'quote':   result = insertAround(ta, '<blockquote>\n  <p>', '</p>\n</blockquote>', 'Quote text'); break
      case 'code':    result = insertAround(ta, '<code>', '</code>', 'code'); break
      case 'ul':      result = insertAround(ta, '<ul>\n  <li>', '</li>\n</ul>', 'List item'); break
      case 'p':       result = insertAround(ta, '<p>', '</p>', 'Paragraph text'); break
      case 'link': {
        const url = prompt('Enter URL:')
        if (!url) return
        result = insertAround(ta, `<a href="${url}">`, '</a>', 'link text')
        break
      }
      case 'img': {
        const src = prompt('Enter image URL:')
        if (!src) return
        const alt = prompt('Alt text (optional):') || ''
        const newVal = ta.value.slice(0, ta.selectionStart) + `\n<figure>\n  <img src="${src}" alt="${alt}" />\n</figure>\n` + ta.value.slice(ta.selectionEnd)
        result = { value: newVal, cursor: ta.selectionStart }
        break
      }
      case 'video': {
        const url = prompt('Paste a YouTube or Vimeo URL:')
        if (!url) return
        const embed = toEmbedSrc(url)
        if (!embed) { alert('Unrecognized URL. Use a YouTube or Vimeo link.'); return }
        const block = `\n<figure class="video-embed">\n  <iframe src="${embed}" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n</figure>\n`
        const newVal = ta.value.slice(0, ta.selectionStart) + block + ta.value.slice(ta.selectionEnd)
        result = { value: newVal, cursor: ta.selectionStart + block.length }
        break
      }
      default: return
    }
    const { value, cursor } = result
    setEditPost(p => ({ ...p, content: value }))
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(cursor, cursor)
    })
  }, [])

  /* ── Filtered / sorted posts ───────────────────────────────── */
  const filteredPosts = posts
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.categories?.some(c => c.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => sortBy === 'date'
      ? new Date(b.date) - new Date(a.date)
      : a.title.localeCompare(b.title)
    )

  /* ── Stats ─────────────────────────────────────────────────── */
  const allCats = [...new Set(posts.flatMap(p => p.categories || []))]
  const allTags = [...new Set(posts.flatMap(p => p.tags || []))]
  const totalWords = posts.reduce((sum, p) => sum + (p.content?.replace(/<[^>]+>/g, '').split(/\s+/).length || 0), 0)

  /* ── Login screen ──────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}><Lock size={24} /><span>ELYSIAN ADMIN</span></div>
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Enter</button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Main admin ────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Admin Portal</h1>
          <p className={styles.pageSubtitle}>
            Elysian Studios — Chronicle Manager
            {ghLoaded
              ? <span className={styles.syncBadge}>● GitHub connected</span>
              : <span className={styles.syncBadgeOff}>● Local preview</span>}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.logoutBtn} onClick={() => setShowTokenPanel(v => !v)}>
            {ghLoaded ? 'Re-sync' : 'Sync with GitHub'}
          </button>
          <button className={styles.logoutBtn} onClick={logout}><LogOut size={15} /> Logout</button>
        </div>
      </div>

      {/* Stats bar */}
      {posts.length > 0 && view === 'list' && (
        <div className={styles.statsBar}>
          <div className={styles.statCard}>
            <BookOpen size={18} />
            <div><span className={styles.statNum}>{posts.length}</span><span className={styles.statLabel}>Chronicles</span></div>
          </div>
          <div className={styles.statCard}>
            <LayoutGrid size={18} />
            <div><span className={styles.statNum}>{allCats.length}</span><span className={styles.statLabel}>Categories</span></div>
          </div>
          <div className={styles.statCard}>
            <FileText size={18} />
            <div><span className={styles.statNum}>{Math.round(totalWords / 1000)}k</span><span className={styles.statLabel}>Total Words</span></div>
          </div>
          <div className={styles.statCard}>
            <Calendar size={18} />
            <div><span className={styles.statNum}>{posts[0]?.date?.split('T')[0] || '—'}</span><span className={styles.statLabel}>Latest Post</span></div>
          </div>
        </div>
      )}

      {/* GitHub token panel (toggle) */}
      {showTokenPanel && (
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
            You're viewing the bundled local posts. Connecting GitHub loads the live data and lets you publish changes.
            Token stored in sessionStorage only — cleared when you close the tab.
          </p>
        </div>
      )}

      {error   && <p className={styles.errorBanner}><AlertCircle size={14} /> {error}</p>}
      {success && <p className={styles.successBanner}>{success}</p>}

      {/* ── List view ──────────────────────────────────────────── */}
      {view === 'list' && posts.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <input
              type="search"
              placeholder="Search chronicles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <div className={styles.sortBtns}>
              <button className={`${styles.sortBtn} ${sortBy === 'date' ? styles.sortActive : ''}`} onClick={() => setSortBy('date')}>
                <Clock size={13} /> Date
              </button>
              <button className={`${styles.sortBtn} ${sortBy === 'title' ? styles.sortActive : ''}`} onClick={() => setSortBy('title')}>
                A–Z
              </button>
            </div>
            <button className="btn btn-primary" onClick={openNew}><Plus size={15} /> New Post</button>
          </div>
          <p className={styles.postCount}>{filteredPosts.length} of {posts.length} chronicles</p>
          <div className={styles.table}>
            {filteredPosts.map(post => (
              <div key={post.id} className={styles.row}>
                {post.image && <img src={post.image} alt="" className={styles.rowThumb} onError={e => e.target.style.display = 'none'} />}
                <div className={styles.rowMain}>
                  <p className={styles.rowTitle}>{post.title}</p>
                  <div className={styles.rowMeta}>
                    <span>{post.date?.split('T')[0]}</span>
                    {post.categories?.slice(0, 2).map(c => <span key={c} className="tag">{c}</span>)}
                    <span>{post.readTime || 5} min read</span>
                    <span className={styles.rowSlug}>{post.slug}</span>
                  </div>
                </div>
                <div className={styles.rowActions}>
                  <button className={styles.editBtn} onClick={() => openEdit(post)} title="Edit"><Edit2 size={14} /></button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteId(post.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── New / Edit form ─────────────────────────────────────── */}
      {(view === 'new' || view === 'edit') && editPost && (
        <div className={styles.form}>
          {/* Form header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>{view === 'new' ? 'New Chronicle' : 'Edit Chronicle'}</h2>
            <div className={styles.formHeaderActions}>
              <button className={styles.cancelBtn} onClick={() => { setView('list'); setEditPost(null) }}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : <><Save size={15} /> Save to GitHub</>}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {['content', 'meta', 'preview'].map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'content' && <FileText size={14} />}
                {tab === 'meta' && <LayoutGrid size={14} />}
                {tab === 'preview' && <Eye size={14} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className={styles.editorPanel}>
              {/* Title */}
              <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
                <label className={styles.label}>Title *</label>
                <input
                  className={`${styles.input} ${styles.titleInput}`}
                  value={editPost.title}
                  onChange={e => setEditPost(p => ({
                    ...p,
                    title: e.target.value,
                    slug: p.slug || slugify(e.target.value)
                  }))}
                  placeholder="Title of the chronicle"
                />
              </div>

              {/* Excerpt */}
              <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
                <label className={styles.label}>Excerpt <span className={styles.labelHint}>(shown in cards)</span></label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  rows={2}
                  value={editPost.excerpt}
                  onChange={e => setEditPost(p => ({ ...p, excerpt: e.target.value }))}
                  placeholder="A short summary shown in card previews…"
                />
              </div>

              {/* Rich editor toolbar */}
              <label className={styles.label}>Content</label>
              <div className={styles.editorToolbar}>
                <div className={styles.toolbarGroup}>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('h2')} title="Heading 2"><Heading2 size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('h3')} title="Heading 3"><Heading3 size={15} /></button>
                </div>
                <div className={styles.toolbarDivider} />
                <div className={styles.toolbarGroup}>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('bold')} title="Bold"><Bold size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('italic')} title="Italic"><Italic size={15} /></button>
                </div>
                <div className={styles.toolbarDivider} />
                <div className={styles.toolbarGroup}>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('p')} title="Paragraph"><FileText size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('ul')} title="List"><List size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('quote')} title="Blockquote"><Quote size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('code')} title="Code"><Code size={15} /></button>
                </div>
                <div className={styles.toolbarDivider} />
                <div className={styles.toolbarGroup}>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('link')} title="Link"><LinkIcon size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('img')} title="Image"><ImageIcon size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('video')} title="Embed video (YouTube / Vimeo)"><Film size={15} /></button>
                </div>
              </div>
              <textarea
                ref={contentRef}
                className={`${styles.input} ${styles.textarea} ${styles.contentArea}`}
                rows={24}
                value={editPost.content}
                onChange={e => setEditPost(p => ({ ...p, content: e.target.value }))}
                placeholder="<p>Your chronicle content here…</p>"
                spellCheck
              />
            </div>
          )}

          {/* Meta Tab */}
          {activeTab === 'meta' && (
            <div className={styles.metaPanel}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Slug</label>
                  <input
                    className={styles.input}
                    value={editPost.slug}
                    onChange={e => setEditPost(p => ({ ...p, slug: slugify(e.target.value) }))}
                    placeholder="auto-generated from title"
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
                    placeholder="https://images.unsplash.com/…"
                  />
                  {editPost.image && (
                    <div className={styles.imgPreview}>
                      <img src={editPost.image} alt="Preview" onError={e => e.target.style.display = 'none'} />
                    </div>
                  )}
                  <label className={styles.label} style={{ marginTop: '1rem' }}>
                    Person / subject <span className={styles.labelHint}>(shown under the featured image)</span>
                  </label>
                  <input
                    className={styles.input}
                    value={editPost.person || ''}
                    onChange={e => setEditPost(p => ({ ...p, person: e.target.value }))}
                    placeholder={personFromImage(editPost.image) || 'e.g. Marie Curie'}
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Categories <span className={styles.labelHint}>(tap to select, or add new)</span></label>
                  <TagPicker
                    options={allCats}
                    value={editPost.categories}
                    onChange={cats => setEditPost(p => ({ ...p, categories: cats }))}
                    placeholder="Add a category…"
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Tags <span className={styles.labelHint}>(tap to select, or add new)</span></label>
                  <TagPicker
                    options={allTags}
                    value={editPost.tags}
                    onChange={tags => setEditPost(p => ({ ...p, tags }))}
                    placeholder="Add a tag…"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className={styles.previewPanel}>
              <div className={styles.previewHeader}>
                {editPost.categories?.slice(0, 1).map(c => <span key={c} className="tag">{c}</span>)}
                <h1 className={styles.previewTitle}>{editPost.title || 'Untitled Chronicle'}</h1>
                {editPost.image && (
                  <figure className={styles.previewFigure}>
                    <img src={editPost.image} alt="" className={styles.previewImg} />
                    {(editPost.person || personFromImage(editPost.image)) && (
                      <figcaption className={styles.previewCaption}>
                        {editPost.person || personFromImage(editPost.image)}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
              <div
                className={styles.previewBody}
                dangerouslySetInnerHTML={{
                  __html: sanitize(parseContent(editPost.content || '<p>No content yet.</p>'))
                }}
              />
            </div>
          )}

          <div className={styles.formActions}>
            <button className="btn btn-ghost" onClick={() => { setView('list'); setEditPost(null) }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Saving…' : <><Save size={15} /> Save to GitHub</>}
            </button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className={styles.modalOverlay} onClick={() => !saving && setDeleteId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Delete this chronicle?</h3>
            <p>
              {ghLoaded
                ? 'This permanently removes the post from the published site (commits to GitHub). This cannot be undone.'
                : 'This removes the post from your local preview. Connect GitHub to publish the deletion to the live site.'}
            </p>
            {error && <p className={styles.modalError}><AlertCircle size={14} /> {error}</p>}
            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => { setError(''); setDeleteId(null) }} disabled={saving}>Cancel</button>
              <button className={`btn ${styles.dangerBtn}`} onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
