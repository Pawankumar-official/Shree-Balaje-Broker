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
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    const result = mode === 'sign-in'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setMessage(result.error ? result.error.message : mode === 'sign-up' ? 'Account created. Check your email if confirmation is required.' : 'Signed in.')
  }
  return <main className="auth-page"><section className="auth-card"><span className="brand-mark">SB</span><p className="eyebrow">SHREE BAL AJE BROKER</p><h1>Secure sign-in</h1><p>Use one owner account for the initial business workspace.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required/></label><label>Password<input type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required/></label><button className="primary-button">{mode === 'sign-in' ? 'Sign in' : 'Create account'}</button></form>{message && <p className="auth-message">{message}</p>}<button className="text-button" onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}>{mode === 'sign-in' ? 'Create the first account' : 'Back to sign in'}</button></section></main>
}
