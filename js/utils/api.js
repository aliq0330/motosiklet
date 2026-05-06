import { db } from '../supabase-client.js';
import { getUser } from '../auth.js';

// ===== ROUTES =====
export async function getRoutes({ page = 0, limit = 12, difficulty, roadType, vehicleType, search, minDist, maxDist, userId } = {}) {
  let q = db.from('routes')
    .select(`*, profiles(id, username, avatar_url, full_name)`, { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);
  if (difficulty) q = q.eq('difficulty', difficulty);
  if (roadType) q = q.eq('road_type', roadType);
  if (vehicleType) q = q.eq('vehicle_type', vehicleType);
  if (search) q = q.ilike('title', `%${search}%`);
  if (minDist) q = q.gte('distance', minDist);
  if (maxDist) q = q.lte('distance', maxDist);
  if (userId) q = q.eq('user_id', userId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function getRoute(id) {
  const { data, error } = await db.from('routes')
    .select(`*, profiles(id, username, avatar_url, full_name, bio)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  // Increment view count
  db.from('routes').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id).then(() => {});
  return data;
}

export async function createRoute(routeData) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('routes')
    .insert({ ...routeData, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRoute(id, updates) {
  const { data, error } = await db.from('routes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRoute(id) {
  const { error } = await db.from('routes').delete().eq('id', id);
  if (error) throw error;
}

export async function saveRoute(routeId) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { error } = await db.from('saved_routes')
    .upsert({ user_id: user.id, route_id: routeId }, { onConflict: 'user_id,route_id' });
  if (error) throw error;
  db.from('routes').update({ save_count: db.from('routes').select('save_count') }).eq('id', routeId).then(() => {});
}

export async function unsaveRoute(routeId) {
  const user = getUser();
  if (!user) return;
  const { error } = await db.from('saved_routes')
    .delete()
    .eq('user_id', user.id)
    .eq('route_id', routeId);
  if (error) throw error;
}

export async function isRouteSaved(routeId) {
  const user = getUser();
  if (!user) return false;
  const { data } = await db.from('saved_routes')
    .select('id')
    .eq('user_id', user.id)
    .eq('route_id', routeId)
    .single();
  return !!data;
}

export async function getRouteReviews(routeId) {
  const { data, error } = await db.from('route_reviews')
    .select(`*, profiles(id, username, avatar_url, full_name)`)
    .eq('route_id', routeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addRouteReview(routeId, rating, comment) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('route_reviews')
    .upsert({ route_id: routeId, user_id: user.id, rating, comment }, { onConflict: 'route_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== EVENTS =====
export async function getEvents({ page = 0, limit = 12, upcoming = false, userId, clubId } = {}) {
  let q = db.from('events')
    .select(`*, profiles(id, username, avatar_url, full_name), routes(id, title, distance)`, { count: 'exact' })
    .eq('is_public', true)
    .order('date', { ascending: true })
    .range(page * limit, page * limit + limit - 1);
  if (upcoming) q = q.gte('date', new Date().toISOString());
  if (userId) q = q.eq('created_by', userId);
  if (clubId) q = q.eq('club_id', clubId);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function getEvent(id) {
  const { data, error } = await db.from('events')
    .select(`*, profiles(id, username, avatar_url, full_name), routes(id, title, distance, map_data, waypoints), clubs(id, name)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createEvent(eventData) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('events')
    .insert({ ...eventData, created_by: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEventParticipants(eventId) {
  const { data, error } = await db.from('event_participants')
    .select(`*, profiles(id, username, avatar_url, full_name)`)
    .eq('event_id', eventId);
  if (error) throw error;
  return data || [];
}

export async function rsvpEvent(eventId, status) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('event_participants')
    .upsert({ event_id: eventId, user_id: user.id, status }, { onConflict: 'event_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserRsvp(eventId) {
  const user = getUser();
  if (!user) return null;
  const { data } = await db.from('event_participants')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();
  return data?.status || null;
}

// ===== CLUBS =====
export async function getClubs({ page = 0, limit = 12, search } = {}) {
  let q = db.from('clubs')
    .select('*', { count: 'exact' })
    .eq('is_public', true)
    .order('member_count', { ascending: false })
    .range(page * limit, page * limit + limit - 1);
  if (search) q = q.ilike('name', `%${search}%`);
  const { data, error, count } = await q;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export async function getClub(id) {
  const { data, error } = await db.from('clubs')
    .select(`*, profiles!owner_id(id, username, avatar_url, full_name)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createClub(clubData) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('clubs')
    .insert({ ...clubData, owner_id: user.id })
    .select()
    .single();
  if (error) throw error;
  await db.from('club_members')
    .insert({ club_id: data.id, user_id: user.id, role: 'admin' });
  return data;
}

export async function joinClub(clubId) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { error } = await db.from('club_members')
    .upsert({ club_id: clubId, user_id: user.id, role: 'member', status: 'active' },
      { onConflict: 'club_id,user_id' });
  if (error) throw error;
}

export async function leaveClub(clubId) {
  const user = getUser();
  if (!user) return;
  const { error } = await db.from('club_members')
    .delete()
    .eq('club_id', clubId)
    .eq('user_id', user.id);
  if (error) throw error;
}

export async function isClubMember(clubId) {
  const user = getUser();
  if (!user) return false;
  const { data } = await db.from('club_members')
    .select('id')
    .eq('club_id', clubId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  return !!data;
}

export async function getClubMembers(clubId) {
  const { data, error } = await db.from('club_members')
    .select(`*, profiles(id, username, avatar_url, full_name)`)
    .eq('club_id', clubId)
    .eq('status', 'active');
  if (error) throw error;
  return data || [];
}

// ===== FOLLOWS =====
export async function followUser(userId) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { error } = await db.from('follows')
    .upsert({ follower_id: user.id, following_id: userId }, { onConflict: 'follower_id,following_id' });
  if (error) throw error;
}

export async function unfollowUser(userId) {
  const user = getUser();
  if (!user) return;
  const { error } = await db.from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', userId);
  if (error) throw error;
}

export async function isFollowing(userId) {
  const user = getUser();
  if (!user) return false;
  const { data } = await db.from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', userId)
    .single();
  return !!data;
}

// ===== PROFILES =====
export async function getProfile(id) {
  const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username) {
  const { data, error } = await db.from('profiles').select('*').eq('username', username).single();
  if (error) throw error;
  return data;
}

// ===== MESSAGES =====
export async function getConversations() {
  const user = getUser();
  if (!user) return [];
  const { data, error } = await db.from('messages')
    .select(`*, sender:profiles!sender_id(id, username, avatar_url, full_name), receiver:profiles!receiver_id(id, username, avatar_url, full_name)`)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .is('club_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Group by conversation partner
  const convMap = new Map();
  (data || []).forEach(msg => {
    const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(partnerId)) {
      const partner = msg.sender_id === user.id ? msg.receiver : msg.sender;
      convMap.set(partnerId, { partner, lastMessage: msg, unread: 0 });
    }
    if (msg.receiver_id === user.id && !msg.is_read) {
      convMap.get(partnerId).unread++;
    }
  });
  return Array.from(convMap.values());
}

export async function getMessages(partnerId, limit = 50) {
  const user = getUser();
  if (!user) return [];
  const { data, error } = await db.from('messages')
    .select(`*, sender:profiles!sender_id(id, username, avatar_url, full_name)`)
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
    .is('club_id', null)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  // Mark as read
  db.from('messages')
    .update({ is_read: true })
    .eq('sender_id', partnerId)
    .eq('receiver_id', user.id)
    .eq('is_read', false)
    .then(() => {});
  return data || [];
}

export async function sendMessage(receiverId, content) {
  const user = getUser();
  if (!user) throw new Error('Giriş gerekli');
  const { data, error } = await db.from('messages')
    .insert({ sender_id: user.id, receiver_id: receiverId, content })
    .select(`*, sender:profiles!sender_id(id, username, avatar_url, full_name)`)
    .single();
  if (error) throw error;
  return data;
}

// ===== NOTIFICATIONS =====
export async function getNotifications() {
  const user = getUser();
  if (!user) return [];
  const { data, error } = await db.from('notifications')
    .select(`*, actor:profiles!actor_id(id, username, avatar_url, full_name)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function markNotificationsRead() {
  const user = getUser();
  if (!user) return;
  await db.from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

// ===== SEARCH =====
export async function search(query) {
  if (!query || query.length < 2) return { routes: [], events: [], users: [], clubs: [] };
  const [routes, events, users, clubs] = await Promise.all([
    db.from('routes').select('id,title,distance,difficulty').ilike('title', `%${query}%`).eq('is_public', true).limit(5),
    db.from('events').select('id,title,date,location_name').ilike('title', `%${query}%`).eq('is_public', true).limit(5),
    db.from('profiles').select('id,username,full_name,avatar_url').ilike('username', `%${query}%`).limit(5),
    db.from('clubs').select('id,name,member_count').ilike('name', `%${query}%`).eq('is_public', true).limit(5)
  ]);
  return {
    routes: routes.data || [],
    events: events.data || [],
    users: users.data || [],
    clubs: clubs.data || []
  };
}

// ===== DASHBOARD FEED =====
export async function getDashboardFeed(userId) {
  // Get recent routes from followed users
  const { data: followings } = await db.from('follows').select('following_id').eq('follower_id', userId);
  const ids = (followings || []).map(f => f.following_id);
  ids.push(userId);

  const [routes, events] = await Promise.all([
    db.from('routes')
      .select(`*, profiles(id, username, avatar_url, full_name)`)
      .in('user_id', ids)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10),
    db.from('events')
      .select(`*, profiles(id, username, avatar_url, full_name)`)
      .gte('date', new Date().toISOString())
      .eq('is_public', true)
      .order('date', { ascending: true })
      .limit(6)
  ]);

  return { routes: routes.data || [], events: events.data || [] };
}
