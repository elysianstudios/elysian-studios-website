import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Eye, EyeOff, Plus, Edit2, Trash2, Save, X, Lock, LogOut, AlertCircle, FileText, Image as ImageIcon, Bold, Italic, List, Link as LinkIcon, Heading2, Heading3, Quote, Code, LayoutGrid, BookOpen, Calendar, Clock, Film, UploadCloud } from 'lucide-react'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { slugify } from '../utils/githubApi'
import { parseContent } from '../utils/parseContent'
import { sanitize } from '../utils/sanitizeHtml'
import { personFromImage } from '../utils/postMeta'
import { auth, db, POSTS_COLLECTION } from '../lib/firebase'
import { clearPostsCache } from '../hooks/usePosts'
import styles from '../styles/Admin.module.css'

// Cloudinary image hosting. Uploads from the browser use an UNSIGNED upload
// preset, so no API key/secret is ever exposed here. Create an unsigned preset
// named below in your Cloudinary dashboard: Settings → Upload → Upload presets.
const CLOUDINARY_CLOUD  = 'ddpq9ziwk'
const CLOUDINARY_PRESET = 'elysian_unsigned'

// Upload a File to Cloudinary; returns an optimized (f_auto,q_auto) delivery URL.
async function uploadToCloudinary(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', CLOUDINARY_PRESET)
  fd.append('folder', 'elysian')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: fd,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Upload failed (${res.status})`)
  return data.secure_url.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
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
  const [authed,    setAuthed]    = useState(false)
  const [authReady, setAuthReady] = useState(false) // Firebase auth state resolved
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [pwError,   setPwError]   = useState('')
  const [showPw,    setShowPw]    = useState(false)

  const [posts,     setPosts]     = useState([])
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  const [view,      setView]      = useState('list')
  const [editPost,  setEditPost]  = useState(null)
  const [preview,   setPreview]   = useState(false)
  const [activeTab, setActiveTab] = useState('content') // 'content' | 'meta' | 'preview'

  const [search,    setSearch]    = useState('')
  const [deleteId,  setDeleteId]  = useState(null)
  const [sortBy,    setSortBy]    = useState('date') // 'date' | 'title'
  const [uploading, setUploading] = useState(false)

  const contentRef       = useRef(null)
  const contentImgRef    = useRef(null) // hidden file input for in-content uploads
  const featuredImgRef   = useRef(null) // hidden file input for the featured image

  /* ── Auth: track Firebase session; load posts once signed in ── */
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthed(!!user)
      setAuthReady(true)
      if (user) loadPosts()
      else setPosts([])
    })
  }, [])

  const login = async (e) => {
    e.preventDefault()
    setPwError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      // onAuthStateChanged handles the rest.
    } catch (err) {
      const map = {
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/invalid-email': 'That email address looks invalid.',
        'auth/too-many-requests': 'Too many attempts — try again shortly.',
      }
      setPwError(map[err.code] || 'Sign-in failed: ' + (err.code || err.message))
    }
  }

  const logout = () => signOut(auth)

  /* ── Load posts from Firestore ─────────────────────────────── */
  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const snap = await getDocs(collection(db, POSTS_COLLECTION))
      const list = snap.docs.map(d => {
        const data = d.data()
        return { ...data, id: data.id ?? d.id }
      })
      list.sort((a, b) => new Date(b.date) - new Date(a.date))
      setPosts(list)
    } catch (e) {
      setError('Could not load posts: ' + e.message)
    } finally {
      setLoading(false)
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
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setSaving(true)
    setError('')
    try {
      await setDoc(doc(db, POSTS_COLLECTION, String(post.id)), post)
      clearPostsCache() // public site re-fetches fresh data
      setPosts(view === 'new' ? [post, ...posts] : posts.map(p => p.id === post.id ? post : p))
      setSuccess('Saved ✓ — live instantly.')
      setTimeout(() => setSuccess(''), 3500)
      setView('list')
      setEditPost(null)
    } catch (e) {
      setError('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    const id = deleteId
    setSaving(true)
    setError('')
    try {
      await deleteDoc(doc(db, POSTS_COLLECTION, String(id)))
      clearPostsCache()
      setPosts(posts.filter(p => p.id !== id))
      setDeleteId(null)
      setSuccess('Deleted ✓ — removed from the live site.')
      setTimeout(() => setSuccess(''), 3500)
    } catch (e) {
      setError('Delete failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ── Image upload (Cloudinary, unsigned) ───────────────────── */
  const handleUpload = async (file, onUrl) => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const url = await uploadToCloudinary(file)
      onUrl(url)
      setSuccess('Image uploaded to Cloudinary.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(`Image upload failed: ${e.message}. Make sure an unsigned upload preset named "${CLOUDINARY_PRESET}" exists in your Cloudinary dashboard (Settings → Upload).`)
    } finally {
      setUploading(false)
    }
  }

  // Insert an uploaded image into the content at the cursor.
  const insertImageHtml = (url) => {
    const ta = contentRef.current
    const block = `\n<figure>\n  <img src="${url}" alt="" />\n</figure>\n`
    setEditPost(p => {
      const c = p.content || ''
      const start = ta ? ta.selectionStart : c.length
      const end = ta ? ta.selectionEnd : c.length
      return { ...p, content: c.slice(0, start) + block + c.slice(end) }
    })
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
  if (!authReady) {
    return <div className={styles.loginPage}><div className={styles.loginCard}><p className={styles.loginSub}>Loading…</p></div></div>
  }
  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}><Lock size={24} /><span>ELYSIAN ADMIN</span></div>
          <p className={styles.loginSub}>Sign in to manage the chronicles.</p>
          <form onSubmit={login} className={styles.loginForm}>
            <div className={styles.inputWrap}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="username"
                className={styles.input}
              />
            </div>
            <div className={styles.inputWrap}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className={styles.input}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwError && <p className={styles.errorMsg}><AlertCircle size={14} /> {pwError}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign in</button>
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
            <span className={styles.syncBadge}>● Live database</span>
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.logoutBtn} onClick={loadPosts} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
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
                {saving ? 'Saving…' : <><Save size={15} /> Save</>}
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
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('img')} title="Image by URL"><ImageIcon size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => contentImgRef.current?.click()} title="Upload image" disabled={uploading}><UploadCloud size={15} /></button>
                  <button type="button" className={styles.toolBtn} onClick={() => applyFormat('video')} title="Embed video (YouTube / Vimeo)"><Film size={15} /></button>
                  <input
                    ref={contentImgRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { handleUpload(e.target.files?.[0], insertImageHtml); e.target.value = '' }}
                  />
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
                  <label className={styles.label}>Featured Image <span className={styles.labelHint}>(paste a URL or upload)</span></label>
                  <div className={styles.uploadRow}>
                    <input
                      className={styles.input}
                      value={editPost.image}
                      onChange={e => setEditPost(p => ({ ...p, image: e.target.value }))}
                      placeholder="https://res.cloudinary.com/… or upload →"
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => featuredImgRef.current?.click()}
                      disabled={uploading}
                    >
                      <UploadCloud size={15} /> {uploading ? 'Uploading…' : 'Upload'}
                    </button>
                    <input
                      ref={featuredImgRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => { handleUpload(e.target.files?.[0], url => setEditPost(p => ({ ...p, image: url }))); e.target.value = '' }}
                    />
                  </div>
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

      {/* Delete modal — portaled to <body> so no ancestor transform can
          trap its fixed positioning; always centered on the viewport. */}
      {deleteId && createPortal(
        <div className={styles.modalOverlay} onClick={() => !saving && setDeleteId(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Delete this chronicle?</h3>
            <p>
              This permanently removes the post from the live site. This cannot be undone.
            </p>
            {error && <p className={styles.modalError}><AlertCircle size={14} /> {error}</p>}
            <div className={styles.modalActions}>
              <button className="btn btn-ghost" onClick={() => { setError(''); setDeleteId(null) }} disabled={saving}>Cancel</button>
              <button className={`btn ${styles.dangerBtn}`} onClick={confirmDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
