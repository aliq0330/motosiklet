import { db } from './supabase-client.js';
import { DEFAULT_AVATAR } from './config.js';

let currentUser = null;
let currentProfile = null;
const listeners = new Set();

export function onAuthChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notify(user, profile) {
  listeners.forEach(fn => fn(user, profile));
}

export async function initAuth() {
  const supabase = db.auth();
  if (!supabase) return;

  supabase.onAuthStateChange(async (event, session) => {
    try {
      if (session?.user) {
        currentUser = session.user;
        currentProfile = await fetchProfile(session.user.id).catch(() => null);
      } else {
        currentUser = null;
        currentProfile = null;
      }
    } catch {}
    notify(currentUser, currentProfile);
  });

  try {
    const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000));
    const { data: { session } } = await Promise.race([supabase.getSession(), timeout]);
    if (session?.user) {
      currentUser = session.user;
      currentProfile = await fetchProfile(session.user.id).catch(() => null);
    }
  } catch {}
  notify(currentUser, currentProfile);
}

async function fetchProfile(userId) {
  const { data } = await db.from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function signUp(email, password, username, fullName) {
  const supabase = db.auth();
  const { data, error } = await supabase.signUp({
    email,
    password,
    options: {
      data: { username, full_name: fullName }
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const supabase = db.auth();
  const { data, error } = await supabase.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const supabase = db.auth();
  const { data, error } = await supabase.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = db.auth();
  await supabase.signOut();
}

export async function resetPassword(email) {
  const supabase = db.auth();
  const { error } = await supabase.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname + '#/reset-password'
  });
  if (error) throw error;
}

export async function updateProfile(updates) {
  if (!currentUser) throw new Error('Not authenticated');
  const { data, error } = await db.from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', currentUser.id)
    .select()
    .single();
  if (error) throw error;
  currentProfile = data;
  notify(currentUser, currentProfile);
  return data;
}

export function getUser() { return currentUser; }
export function getProfile() { return currentProfile; }
export function isLoggedIn() { return !!currentUser; }

export function getAvatarUrl(profile) {
  if (!profile?.avatar_url) return DEFAULT_AVATAR;
  if (profile.avatar_url.startsWith('http')) return profile.avatar_url;
  return DEFAULT_AVATAR;
}
