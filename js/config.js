// Supabase Configuration
// Replace with your own Supabase project URL and anon key
// Get these from https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
export const SUPABASE_URL = 'https://ekejudestlnnluizbpky.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZWp1ZGVzdGxubmx1aXpicGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODA5NzksImV4cCI6MjA5MzY1Njk3OX0.R5IZMKt2-4S3piGh4aBqYqyYc6W_tqFVjcqzrOIkMqs';

// App Configuration
export const APP_NAME = 'MotoRoute';
export const APP_VERSION = '1.0.0';

// GitHub Pages base path (change to your repo name)
export const BASE_PATH = '/motosiklet';

// Map defaults (Turkey center)
export const MAP_DEFAULT = {
  center: [39.9334, 32.8597],
  zoom: 6
};

// Default avatar placeholder
export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23FF6B35'/%3E%3Ccircle cx='20' cy='16' r='6' fill='rgba(255,255,255,0.9)'/%3E%3Cellipse cx='20' cy='34' rx='10' ry='8' fill='rgba(255,255,255,0.9)'/%3E%3C/svg%3E";

// Route difficulty levels
export const DIFFICULTY_LABELS = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
  expert: 'Uzman'
};

// Vehicle types
export const VEHICLE_LABELS = {
  motorcycle: 'Motosiklet',
  bicycle: 'Bisiklet',
  both: 'Her İkisi'
};

// Road types
export const ROAD_TYPE_LABELS = {
  asphalt: 'Asfalt',
  offroad: 'Off-Road',
  mixed: 'Karma'
};

// Event RSVP statuses
export const RSVP_LABELS = {
  going: 'Katılıyorum',
  maybe: 'Belki',
  not_going: 'Katılmıyorum'
};
