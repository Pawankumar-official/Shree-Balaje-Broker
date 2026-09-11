import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!ready) return <div className="auth-page"><p>Opening secure workspace…</p></div>
  if (!isSupabaseConfigured) return <>{children}</>
  if (!session) return <SignIn />
  return <>{children}</>
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [message, setMessage] = useState('')
  const [kind, setKind] = useState<'info' | 'success' | 'error'>('info')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const confirmationOptions = { emailRedirectTo: window.location.origin }
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: confirmationOptions })
    setBusy(false)
    if (result.error) { setKind('error'); setMessage(result.error.message) }
    else { setKind('success'); setMessage(mode === 'sign-up' ? 'Account created. Check your email if confirmation is required.' : 'Signed in.') }
  }
  const resendConfirmation = async () => {
    if (!supabase || !email) { setKind('error'); setMessage('Enter the email address first, then choose “Send a fresh confirmation email”.'); return }
    const result = await supabase.auth.resend({ type: 'signup', email, options: confirmationOptions })
    setKind(result.error ? 'error' : 'success')
    setMessage(result.error ? result.error.message : 'A fresh confirmation email has been sent. Use only the newest link.')
  }
  return <main className="auth-page"><div className="auth-wrap"><aside className="auth-brand"><div className="auth-brand-inner"><span className="brand-mark" aria-hidden="true">SB</span><p className="eyebrow">SHREE BALAJE BROKER</p><h1>Movement, trade &amp; settlements — one secure workspace.</h1><p className="auth-tagline">Manage deals, transport, payments and registers from anywhere, with full history preserved.</p></div></aside><section className="auth-panel"><div className="auth-card"><span className="auth-emblem"><span className="brand-mark" aria-hidden="true">SB</span></span><p className="eyebrow">SHREE BALAJE BROKER</p><h1>{mode === 'sign-in' ? 'Secure sign-in' : 'Create account'}</h1><p className="auth-lead">{mode === 'sign-in' ? 'Use one owner account for the initial business workspace.' : 'Set up the owner account to open your secure cloud workspace.'}</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><label>Password<span className="password-field"><input type={showPassword ? 'text' : 'password'} minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required/><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '🙈' : '👁'}</button></span></label><button className="primary-button auth-submit" disabled={busy} aria-busy={busy}>{busy ? (mode === 'sign-in' ? 'Signing in…' : 'Creating account…') : (mode === 'sign-in' ? 'Sign in' : 'Create account')}</button></form>{message && <p className={`auth-message auth-message--${kind}`} role="alert">{message}</p>}{mode === 'sign-up' && <button className="text-button" type="button" onClick={resendConfirmation}>Send a fresh confirmation email</button>}<button className="text-button auth-switch" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setKind('info'); setMessage('') }}>{mode === 'sign-in' ? 'Create the first account' : 'Back to sign in'}</button></div></section></div></main>
}
