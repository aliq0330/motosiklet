-- =============================================
-- MotoRoute - Supabase Database Setup
-- Run this SQL in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  location TEXT,
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'both')),
  total_km DECIMAL(10,2) DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  avg_speed DECIMAL(5,2) DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROUTES
-- =============================================
CREATE TABLE public.routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT,
  distance DECIMAL(10,2),
  elevation_gain INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  road_type TEXT CHECK (road_type IN ('asphalt', 'offroad', 'mixed')),
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'both')),
  waypoints JSONB,  -- Array of [lat, lng, elevation] points
  map_data JSONB,   -- GeoJSON for complex shapes
  thumbnail_url TEXT,
  safety_score DECIMAL(3,2) DEFAULT 0 CHECK (safety_score >= 0 AND safety_score <= 5),
  rating_avg DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_user ON public.routes(user_id);
CREATE INDEX idx_routes_public ON public.routes(is_public, created_at DESC);
CREATE INDEX idx_routes_difficulty ON public.routes(difficulty);
CREATE INDEX idx_routes_vehicle ON public.routes(vehicle_type);

-- =============================================
-- ROUTE REVIEWS
-- =============================================
CREATE TABLE public.route_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, user_id)
);

CREATE INDEX idx_reviews_route ON public.route_reviews(route_id);

-- Update route rating on review insert/update
CREATE OR REPLACE FUNCTION update_route_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.routes SET
    rating_avg = (SELECT AVG(rating) FROM public.route_reviews WHERE route_id = COALESCE(NEW.route_id, OLD.route_id)),
    rating_count = (SELECT COUNT(*) FROM public.route_reviews WHERE route_id = COALESCE(NEW.route_id, OLD.route_id))
  WHERE id = COALESCE(NEW.route_id, OLD.route_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.route_reviews
  FOR EACH ROW EXECUTE FUNCTION update_route_rating();

-- =============================================
-- SAVED ROUTES
-- =============================================
CREATE TABLE public.saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Update save_count
CREATE OR REPLACE FUNCTION update_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.routes SET save_count = save_count + 1 WHERE id = NEW.route_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.routes SET save_count = GREATEST(save_count - 1, 0) WHERE id = OLD.route_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_save_change
  AFTER INSERT OR DELETE ON public.saved_routes
  FOR EACH ROW EXECUTE FUNCTION update_save_count();

-- =============================================
-- CLUBS
-- =============================================
CREATE TABLE public.clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  owner_id UUID REFERENCES public.profiles(id),
  member_count INTEGER DEFAULT 0,
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'both')),
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  join_type TEXT DEFAULT 'open' CHECK (join_type IN ('open', 'approval', 'invite')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_public ON public.clubs(is_public, member_count DESC);

-- =============================================
-- CLUB MEMBERS
-- =============================================
CREATE TABLE public.club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'banned')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members ON public.club_members(club_id, status);

-- Update member count
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE public.clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.club_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE public.clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
    ELSIF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE public.clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.club_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_club_member_change
  AFTER INSERT OR UPDATE OR DELETE ON public.club_members
  FOR EACH ROW EXECUTE FUNCTION update_club_member_count();

-- =============================================
-- EVENTS
-- =============================================
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location_name TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  max_participants INTEGER,
  participant_count INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  vehicle_type TEXT DEFAULT 'motorcycle' CHECK (vehicle_type IN ('motorcycle', 'bicycle', 'both')),
  is_public BOOLEAN DEFAULT true,
  cover_image TEXT,
  required_equipment TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON public.events(date);
CREATE INDEX idx_events_public ON public.events(is_public, date);
CREATE INDEX idx_events_creator ON public.events(created_by);

-- =============================================
-- EVENT PARTICIPANTS
-- =============================================
CREATE TABLE public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_participants ON public.event_participants(event_id);

-- Update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events SET
    participant_count = (
      SELECT COUNT(*) FROM public.event_participants
      WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) AND status = 'going'
    )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_participant_change
  AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION update_participant_count();

-- =============================================
-- FOLLOWS
-- =============================================
CREATE TABLE public.follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Update follow counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, body, actor_id, link)
    VALUES (NEW.following_id, 'follow', 'Yeni Takipçi', 'Sizi takip etmeye başladı', NEW.follower_id, '/profile/' || NEW.follower_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = OLD.following_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- =============================================
-- MESSAGES
-- =============================================
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id, is_read);
CREATE INDEX idx_messages_club ON public.messages(club_id, created_at);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ROUTES policies
CREATE POLICY "Public routes viewable" ON public.routes FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Authenticated can create routes" ON public.routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own routes" ON public.routes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own routes" ON public.routes FOR DELETE USING (auth.uid() = user_id);

-- ROUTE REVIEWS policies
CREATE POLICY "Reviews viewable by all" ON public.route_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated can review" ON public.route_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review" ON public.route_reviews FOR UPDATE USING (auth.uid() = user_id);

-- SAVED ROUTES policies
CREATE POLICY "Users see own saved" ON public.saved_routes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save" ON public.saved_routes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave" ON public.saved_routes FOR DELETE USING (auth.uid() = user_id);

-- CLUBS policies
CREATE POLICY "Public clubs viewable" ON public.clubs FOR SELECT USING (is_public = true OR auth.uid() = owner_id);
CREATE POLICY "Authenticated can create clubs" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update clubs" ON public.clubs FOR UPDATE USING (auth.uid() = owner_id);

-- CLUB MEMBERS policies
CREATE POLICY "Members viewable" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- EVENTS policies
CREATE POLICY "Public events viewable" ON public.events FOR SELECT USING (is_public = true OR auth.uid() = created_by);
CREATE POLICY "Authenticated can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators update events" ON public.events FOR UPDATE USING (auth.uid() = created_by);

-- EVENT PARTICIPANTS policies
CREATE POLICY "Participants viewable" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Users can rsvp" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own rsvp" ON public.event_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own rsvp" ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- FOLLOWS policies
CREATE POLICY "Follows viewable" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- MESSAGES policies
CREATE POLICY "Users see own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated can send" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark read" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- NOTIFICATIONS policies
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('routes', 'routes', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clubs', 'clubs', true) ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read covers" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Auth upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Auth update covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read routes" ON storage.objects FOR SELECT USING (bucket_id = 'routes');
CREATE POLICY "Auth upload routes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'routes' AND auth.role() = 'authenticated');

CREATE POLICY "Public read events" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Auth upload events" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'events' AND auth.role() = 'authenticated');

CREATE POLICY "Public read clubs" ON storage.objects FOR SELECT USING (bucket_id = 'clubs');
CREATE POLICY "Auth upload clubs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clubs' AND auth.role() = 'authenticated');

-- =============================================
-- REALTIME
-- =============================================
-- Enable realtime on these tables:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;

-- =============================================
-- SAMPLE DATA (optional - remove in production)
-- =============================================
-- Uncomment to add test data after first signup

-- INSERT INTO public.routes (user_id, title, description, distance, elevation_gain, difficulty, road_type, vehicle_type, is_public, waypoints)
-- SELECT id, 'Bolu Dağı Panorama Rotası', 'Muhteşem manzaralı yüksek irtifa rotası', 145.5, 2100, 'hard', 'mixed', 'motorcycle', true,
-- '[[40.72,31.58,800],[40.75,31.62,950],[40.78,31.68,1100],[40.81,31.72,1300]]'::jsonb
-- FROM public.profiles LIMIT 1;
