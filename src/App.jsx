import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'ppty-content-hub-v1'
const SESSION_KEY = 'ppty-content-hub-session'

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/

const basePosts = [
  {
    id: 'post-1',
    title: 'Fusión del diseño editorial con datos en vivo',
    summary: 'Una nueva experiencia de contenido visual inspirada en dashboards premium y narrativas claras.',
    category: 'Product Design',
    mediaType: 'image',
    coverUrl:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    createdAt: '2026-10-01T12:00:00.000Z',
    author: 'principal',
    link: '',
    body: 'La publicación principal combina estadísticas, narrativas y estética para mantener la atención sin perder legibilidad.'
  },
  {
    id: 'post-2',
    title: 'Qué cambia cuando el contenido se vuelve operativo',
    summary: 'Los equipos de comunidad y marketing necesitan herramientas para publicar, revisar y coordinar en un solo lugar.',
    category: 'Operations',
    mediaType: 'video',
    coverUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    createdAt: '2026-10-07T11:30:00.000Z',
    author: 'principal',
    link: 'https://example.com/operations',
    body: 'Este contenido demuestra cómo una plataforma de publicación puede mezclar creatividad y operaciones de forma eficiente.'
  },
  {
    id: 'post-3',
    title: 'Revisión de seguridad para administradores',
    summary: 'Se recomienda validar permisos, limitar accesos y registrar cada acción para asegurar la trazabilidad.',
    category: 'Security',
    mediaType: 'text',
    coverUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
    status: 'published',
    createdAt: '2026-10-11T09:15:00.000Z',
    author: 'principal',
    link: '',
    body: 'El panel ofrece auditoría de cambios, permisos por rol y reglas de contraseña para reforzar la seguridad operativa.'
  }
]

const initialPostForm = {
  title: '',
  summary: '',
  category: 'General',
  mediaType: 'image',
  coverUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  status: 'published',
  link: '',
  body: ''
}

const initialAdminForm = {
  username: '',
  password: '',
  otp: ''
}

function makeId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function buildInitialState() {
  return {
    admins: [],
    posts: basePosts,
    audit: [
      {
        id: makeId('audit'),
        actor: 'sistema',
        action: 'Initialized the public content feed.',
        timestamp: new Date().toISOString()
      }
    ]
  }
}

function isStrongPassword(password) {
  return passwordPattern.test(password)
}

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : buildInitialState()
  })

  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    return saved ? JSON.parse(saved) : null
  })

  const [view, setView] = useState('public')
  const [loginForm, setLoginForm] = useState({ username: '', password: '', otp: '' })
  const [postForm, setPostForm] = useState(initialPostForm)
  const [adminForm, setAdminForm] = useState(initialAdminForm)
  const [message, setMessage] = useState('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [session])

  const currentUser = useMemo(
    () => state.admins.find((admin) => admin.username === session?.username && admin.status === 'active') ?? null,
    [state.admins, session],
  )

  const publishedPosts = state.posts.filter((post) => post.status === 'published')
  const draftPosts = state.posts.filter((post) => post.status === 'draft')
  const activeAdmins = state.admins.filter((admin) => admin.status === 'active')

  function appendAudit(actor, action) {
    setState((previous) => ({
      ...previous,
      audit: [
        {
          id: makeId('audit'),
          actor,
          action,
          timestamp: new Date().toISOString()
        },
        ...previous.audit
      ]
    }))
  }

  function handleLogin(event) {
    event.preventDefault()

    if (state.admins.length === 0) {
      const username = loginForm.username.trim()
      const password = loginForm.password
      const otp = loginForm.otp.trim()

      if (!username || !password || !otp) {
        setMessage('Completa usuario, contraseña y código 2FA para crear el primer administrador.')
        return
      }

      if (!isStrongPassword(password)) {
        setMessage('La contraseña debe tener mínimo 12 caracteres, incluir mayúsculas, minúsculas, números y símbolos.')
        return
      }

      const firstAdmin = {
        id: makeId('admin'),
        username,
        password,
        role: 'primary',
        status: 'active',
        twoFactor: true,
        otp
      }

      setState((previous) => ({
        ...previous,
        admins: [firstAdmin],
        audit: [
          {
            id: makeId('audit'),
            actor: username,
            action: 'Created the initial administrator account.',
            timestamp: new Date().toISOString()
          },
          ...previous.audit
        ]
      }))
      setSession({ username, role: 'primary' })
      setView('admin')
      setMessage('Administrador principal creado. Ya puedes gestionar el contenido.')
      return
    }

    const account = state.admins.find(
      (admin) => admin.username.toLowerCase() === loginForm.username.trim().toLowerCase(),
    )

    if (!account || account.status !== 'active') {
      setMessage('No existe una cuenta administrativa activa con ese nombre de usuario.')
      return
    }

    if (account.password !== loginForm.password) {
      setMessage('La contraseña es incorrecta.')
      return
    }

    if (account.twoFactor && (!loginForm.otp || loginForm.otp !== account.otp)) {
      setMessage('Debe completar el código 2FA para ingresar al panel administrativo.')
      return
    }

    setSession({ username: account.username, role: account.role })
    setView('admin')
    setMessage('Acceso autorizado al panel de administración.')
  }

  function handleLogout() {
    setSession(null)
    setView('public')
    setMessage('Sesión cerrada. La página pública sigue disponible para todos.')
  }

  function handleNewPost(event) {
    event.preventDefault()

    if (!currentUser) {
      setMessage('Primero debes iniciar sesión como administrador.')
      return
    }

    if (!postForm.title.trim() || !postForm.summary.trim()) {
      setMessage('Completa al menos el título y la descripción antes de guardar la publicación.')
      return
    }

    const nextPost = {
      id: makeId('post'),
      title: postForm.title.trim(),
      summary: postForm.summary.trim(),
      category: postForm.category,
      mediaType: postForm.mediaType,
      coverUrl: postForm.coverUrl || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
      status: postForm.status,
      createdAt: new Date().toISOString(),
      author: currentUser.username,
      link: postForm.link,
      body: postForm.body || postForm.summary
    }

    setState((previous) => ({
      ...previous,
      posts: [nextPost, ...previous.posts],
      audit: [
        {
          id: makeId('audit'),
          actor: currentUser.username,
          action: `Created ${postForm.status} post: ${nextPost.title}`,
          timestamp: new Date().toISOString()
        },
        ...previous.audit
      ]
    }))

    setPostForm(initialPostForm)
    setMessage(`Publicación creada como ${postForm.status}.`)
  }

  function handleTogglePost(id) {
    if (!currentUser) return

    setState((previous) => {
      const target = previous.posts.find((post) => post.id === id)
      if (!target) return previous

      const nextStatus = target.status === 'published' ? 'draft' : 'published'

      return {
        ...previous,
        posts: previous.posts.map((post) => (post.id === id ? { ...post, status: nextStatus } : post)),
        audit: [
          {
            id: makeId('audit'),
            actor: currentUser.username,
            action: `${nextStatus === 'published' ? 'Published' : 'Saved to draft'}: ${target.title}`,
            timestamp: new Date().toISOString()
          },
          ...previous.audit
        ]
      }
    })

    setMessage('Estado de la publicación actualizado.')
  }

  function handleDeletePost(id, title) {
    if (!currentUser) return

    setState((previous) => ({
      ...previous,
      posts: previous.posts.filter((post) => post.id !== id),
      audit: [
        {
          id: makeId('audit'),
          actor: currentUser.username,
          action: `Deleted post: ${title}`,
          timestamp: new Date().toISOString()
        },
        ...previous.audit
      ]
    }))

    setMessage('La publicación fue eliminada.')
  }

  function handleCreateAdmin(event) {
    event.preventDefault()

    if (currentUser?.role !== 'primary') {
      setMessage('Solo el administrador principal puede crear o revocar otros administradores.')
      return
    }

    const username = adminForm.username.trim()
    const password = adminForm.password

    const otp = adminForm.otp.trim()

    if (!username || !password || !otp) {
      setMessage('Completa nombre de usuario, contraseña y código 2FA para crear un administrador.')
      return
    }

    if (state.admins.filter((admin) => admin.status === 'active').length >= 2) {
      setMessage('El sistema admite máximo dos administradores activos a la vez.')
      return
    }

    if (state.admins.some((admin) => admin.username.toLowerCase() === username.toLowerCase())) {
      setMessage('Ese nombre de usuario ya existe dentro del sistema.')
      return
    }

    if (!isStrongPassword(password)) {
      setMessage('La contraseña debe tener mínimo 12 caracteres, incluir mayúsculas, minúsculas, números y símbolos.')
      return
    }

    const newAdmin = {
      id: makeId('admin'),
      username,
      password,
      role: 'secondary',
      status: 'active',
      twoFactor: true,
      otp
    }

    setState((previous) => ({
      ...previous,
      admins: [...previous.admins, newAdmin],
      audit: [
        {
          id: makeId('audit'),
          actor: currentUser.username,
          action: `Created secondary admin: ${username}`,
          timestamp: new Date().toISOString()
        },
        ...previous.audit
      ]
    }))

    setAdminForm(initialAdminForm)
    setMessage(`Administrador secundario creado: ${username}`)
  }

  function handleRevokeAdmin(adminId, username) {
    if (currentUser?.role !== 'primary') {
      setMessage('Solo el principal puede revocar accesos.')
      return
    }

    setState((previous) => ({
      ...previous,
      admins: previous.admins.map((admin) => {
        if (admin.id !== adminId) return admin
        return { ...admin, status: admin.role === 'primary' ? admin.status : 'revoked' }
      }),
      audit: [
        {
          id: makeId('audit'),
          actor: currentUser.username,
          action: `Revoked admin access: ${username}`,
          timestamp: new Date().toISOString()
        },
        ...previous.audit
      ]
    }))

    setMessage(`Acceso revocado para ${username}.`)
  }

  const publicFeed = useMemo(
    () => state.posts.filter((post) => post.status === 'published'),
    [state.posts],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">P</div>
          <div>
            <p className="eyebrow">PPTY</p>
            <h1>Publishing studio</h1>
          </div>
        </div>

        <nav className="nav">
          <button className={view === 'public' ? 'nav-button active' : 'nav-button'} onClick={() => setView('public')}>
            Público
          </button>
          {currentUser ? (
            <button className={view === 'admin' ? 'nav-button active' : 'nav-button'} onClick={() => setView('admin')}>
              Panel admin
            </button>
          ) : (
            <button className={view === 'login' ? 'nav-button active' : 'nav-button'} onClick={() => setView('login')}>
              Acceder
            </button>
          )}
        </nav>
      </header>

      {message && <div className="flash-message">{message}</div>}

      {view === 'public' && (
        <main className="content-view public-view">
          <section className="hero-panel">
            <div className="hero-copy">
              <p className="eyebrow gradient">Contenido visible para todos</p>
              <h2>Una experiencia web pública premium con publicaciones, medios y panel administrativo privado.</h2>
              <p>
                Cualquier visitante puede explorar contenido, abrir enlaces, mostrar videos e interactuar con las
                publicaciones publicadas. Los administradores mantienen un acceso separado para publicar, gestionar y
                controlar permisos.
              </p>
              <div className="hero-actions">
                <button onClick={() => setView('login')}>Entrar al panel</button>
                <button className="secondary" onClick={() => setView('public')}>Ver publicaciones</button>
              </div>
            </div>
            <div className="hero-card">
              <div className="stats-grid">
                <div>
                  <span>Publicaciones</span>
                  <strong>{publicFeed.length}</strong>
                </div>
                <div>
                  <span>Administradores</span>
                  <strong>{activeAdmins.length}/2</strong>
                </div>
                <div>
                  <span>Estado</span>
                  <strong>Activo</strong>
                </div>
                <div>
                  <span>Seguridad</span>
                  <strong>2FA</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="feed-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Publicaciones</p>
                <h3>Feed abierto</h3>
              </div>
              <span className="badge">{publicFeed.length} visibles</span>
            </div>

            <div className="post-grid">
              {publicFeed.map((post) => (
                <article key={post.id} className="post-card">
                  <img src={post.coverUrl} alt={post.title} />
                  <div className="post-body">
                    <div className="meta-row">
                      <span className="tag">{post.category}</span>
                      <span className="type-pill">{post.mediaType}</span>
                    </div>
                    <h4>{post.title}</h4>
                    <p>{post.summary}</p>
                    {post.link && (
                      <a href={post.link} target="_blank" rel="noreferrer">
                        Abrir enlace
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      )}

      {view === 'login' && (
        <main className="content-view auth-view">
          <div className="panel auth-panel">
            <div className="panel-header">
              <p className="eyebrow">Administradores</p>
              <h3>{state.admins.length === 0 ? 'Crear administrador principal' : 'Iniciar sesión'}</h3>
            </div>

            <form onSubmit={handleLogin} className="auth-form">
              <label>
                Usuario
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                  placeholder="Nombre de usuario"
                />
              </label>

              <label>
                Contraseña
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  placeholder="••••••••••••"
                />
              </label>

              <label>
                Código 2FA
                <input
                  type="text"
                  value={loginForm.otp}
                  onChange={(event) => setLoginForm({ ...loginForm, otp: event.target.value })}
                  placeholder="Tu código 2FA"
                />
              </label>

              <button type="submit">
                {state.admins.length === 0 ? 'Crear administrador y entrar' : 'Entrar al dashboard'}
              </button>
            </form>

            <div className="security-note">
              {state.admins.length === 0 ? (
                <>
                  <strong>Configuración inicial:</strong> crea la primera cuenta administrativa. Usa una contraseña
                  de mínimo 12 caracteres con mayúsculas, minúsculas, números y símbolos, y define tu propio código 2FA.
                </>
              ) : (
                <>
                  <strong>Política recomendada:</strong> mínimo 12 caracteres, combinación de mayúsculas, minúsculas,
                  números y símbolos. El código 2FA es obligatorio para todas las cuentas administrativas.
                </>
              )}
            </div>
          </div>
        </main>
      )}

      {view === 'admin' && currentUser && (
        <main className="content-view admin-view">
          <section className="dashboard-grid">
            <div className="panel admin-panel">
              <div className="panel-header row-header">
                <div>
                  <p className="eyebrow">Panel</p>
                  <h3>Publicaciones</h3>
                </div>
                <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
              </div>

              <form className="post-form" onSubmit={handleNewPost}>
                <div className="two-column">
                  <label>
                    Título
                    <input
                      value={postForm.title}
                      onChange={(event) => setPostForm({ ...postForm, title: event.target.value })}
                      placeholder="Título de la publicación"
                    />
                  </label>

                  <label>
                    Categoría
                    <select
                      value={postForm.category}
                      onChange={(event) => setPostForm({ ...postForm, category: event.target.value })}
                    >
                      <option>General</option>
                      <option>News</option>
                      <option>Security</option>
                      <option>Product Design</option>
                      <option>Operations</option>
                    </select>
                  </label>
                </div>

                <label>
                  Descripción
                  <textarea
                    value={postForm.summary}
                    onChange={(event) => setPostForm({ ...postForm, summary: event.target.value })}
                    rows="3"
                    placeholder="Explica lo que se va a publicar"
                  />
                </label>

                <div className="two-column">
                  <label>
                    Tipo de contenido
                    <select
                      value={postForm.mediaType}
                      onChange={(event) => setPostForm({ ...postForm, mediaType: event.target.value })}
                    >
                      <option value="image">Imagen</option>
                      <option value="video">Video</option>
                      <option value="text">Texto</option>
                      <option value="link">Enlace</option>
                      <option value="document">Documento</option>
                    </select>
                  </label>

                  <label>
                    Estado
                    <select
                      value={postForm.status}
                      onChange={(event) => setPostForm({ ...postForm, status: event.target.value })}
                    >
                      <option value="published">Pública</option>
                      <option value="draft">Borrador</option>
                    </select>
                  </label>
                </div>

                <label>
                  Portada o URL de referencia
                  <input
                    value={postForm.coverUrl}
                    onChange={(event) => setPostForm({ ...postForm, coverUrl: event.target.value })}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Enlace externo (opcional)
                  <input
                    value={postForm.link}
                    onChange={(event) => setPostForm({ ...postForm, link: event.target.value })}
                    placeholder="https://ejemplo.com"
                  />
                </label>

                <label>
                  Cuerpo del contenido
                  <textarea
                    value={postForm.body}
                    onChange={(event) => setPostForm({ ...postForm, body: event.target.value })}
                    rows="4"
                    placeholder="Texto completo para la publicación"
                  />
                </label>

                <button type="submit">Guardar publicación</button>
              </form>
            </div>

            <div className="panel sidebar-panel">
              <div className="panel-header">
                <p className="eyebrow">Visión</p>
                <h3>Control del sistema</h3>
              </div>

              <div className="summary-list">
                <div>
                  <span>Cuenta</span>
                  <strong>{currentUser.username}</strong>
                </div>
                <div>
                  <span>Rol</span>
                  <strong>{currentUser.role === 'primary' ? 'Administrador principal' : 'Secundario'}</strong>
                </div>
                <div>
                  <span>Publicadas</span>
                  <strong>{publishedPosts.length}</strong>
                </div>
                <div>
                  <span>Borradores</span>
                  <strong>{draftPosts.length}</strong>
                </div>
              </div>

              {currentUser.role === 'primary' && (
                <form className="admin-creator" onSubmit={handleCreateAdmin}>
                  <h4>Crear segundo administrador</h4>
                  <label>
                    Usuario
                    <input
                      value={adminForm.username}
                      onChange={(event) => setAdminForm({ ...adminForm, username: event.target.value })}
                      placeholder="admin2"
                    />
                  </label>

                  <label>
                    Contraseña segura
                    <input
                      type="password"
                      value={adminForm.password}
                      onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                      placeholder="Mínimo 12 caracteres"
                    />
                  </label>

                  <label>
                    Código 2FA
                    <input
                      value={adminForm.otp}
                      onChange={(event) => setAdminForm({ ...adminForm, otp: event.target.value })}
                      placeholder="Código 2FA"
                    />
                  </label>

                  <button type="submit">Crear cuenta</button>
                </form>
              )}

              <div className="admin-list">
                <h4>Administradores</h4>
                {state.admins.map((admin) => (
                  <div key={admin.id} className="admin-row">
                    <div>
                      <strong>{admin.username}</strong>
                      <span>{admin.role === 'primary' ? 'Principal' : 'Secundario'}</span>
                    </div>
                    <div className="admin-status">
                      <span className={admin.status === 'active' ? 'status active' : 'status revoked'}>
                        {admin.status === 'active' ? 'Activo' : 'Revocado'}
                      </span>
                      {admin.role !== 'primary' && admin.status === 'active' && (
                        <button type="button" onClick={() => handleRevokeAdmin(admin.id, admin.username)}>
                          Revocar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel activity-panel">
            <div className="panel-header">
              <p className="eyebrow">Historial</p>
              <h3>Bitácora de cambios</h3>
            </div>

            <div className="audit-list">
              {state.audit.map((entry) => (
                <div key={entry.id} className="audit-item">
                  <strong>{entry.actor}</strong>
                  <span>{entry.action}</span>
                  <small>{new Date(entry.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="panel list-panel">
            <div className="panel-header">
              <p className="eyebrow">Gestión</p>
              <h3>Publicaciones activas</h3>
            </div>

            <div className="management-list">
              {state.posts.map((post) => (
                <div key={post.id} className="management-row">
                  <div>
                    <strong>{post.title}</strong>
                    <span>{post.status === 'published' ? 'Visible públicamente' : 'Borrador privado'}</span>
                  </div>
                  <div className="row-actions">
                    <button type="button" onClick={() => handleTogglePost(post.id)}>
                      {post.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
                    </button>
                    <button type="button" className="danger" onClick={() => handleDeletePost(post.id, post.title)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
