import { supabase, isSupabased } from './lib/supabase.js'

const STORAGE_KEY = 'kainos_user'

export function getLocalUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function saveLocalUser(u) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
}

export async function getCurrentUser() {
  if (isSupabased()) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      return { id: user.id, email: user.email, name: profile?.name || '', role: profile?.role || 'user', verified: user.email_confirmed_at ? true : false }
    }
    return null
  }
  return getLocalUser()
}

export async function signUp(name, email, password) {
  if (isSupabased()) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw error
    return data.user
  }

  const existing = getLocalUser()
  if (existing && existing.email === email) throw new Error('Account already exists')
  const user = { name, email, verified: false }
  saveLocalUser(user)
  return user
}

export async function signIn(email, password) {
  if (isSupabased()) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
    return { id: data.user.id, email: data.user.email, name: profile?.name || '', role: profile?.role || 'user', verified: !!data.user.email_confirmed_at }
  }

  const existing = getLocalUser()
  if (existing && existing.email === email) return existing
  if (existing && existing.email !== email) {
    saveLocalUser({ ...existing, email })
    return { ...existing, email }
  }
  throw new Error('No account found')
}

export async function signOut() {
  if (isSupabased()) {
    await supabase.auth.signOut()
  }
  localStorage.removeItem(STORAGE_KEY)
  currentUser = null
}

export async function verifyUser(name, email, code, entered) {
  const user = { name, email, verified: entered === code }
  saveLocalUser(user)
  return user
}

let currentUser = null

export function setCurrentUser(u) {
  currentUser = u
}

export function getCachedUser() {
  return currentUser || getLocalUser()
}
