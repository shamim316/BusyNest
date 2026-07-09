import { FormEvent, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signin') {
        const err = await signIn(email, password)
        if (err) setError(err)
      } else {
        const { error: err, needsConfirm } = await signUp(name, email, password)
        if (err) setError(err)
        else if (needsConfirm)
          setNotice('Check your inbox — we sent you a confirmation email. Click the link, then sign in here.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand brand--lg">
          <img src="/nest.svg" alt="" className="brand__logo" />
          <span className="brand__name">BusyNest</span>
        </div>
        <h1>{mode === 'signin' ? 'Welcome back' : 'Create your nest'}</h1>
        <p className="muted">
          {mode === 'signin'
            ? 'Sign in to your private workspace.'
            : 'Your own private space for projects, notes and plans.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <label>
              Your name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shamim"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </label>

          {error && <div className="form-alert form-alert--error">{error}</div>}
          {notice && <div className="form-alert form-alert--info">{notice}</div>}

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signin' ? (
            <>
              New here?{' '}
              <button className="linklike" onClick={() => { setMode('signup'); setError(null) }}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="linklike" onClick={() => { setMode('signin'); setError(null) }}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
