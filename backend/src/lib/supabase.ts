import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (use for client-side operations)
export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Service role client (use for server-side operations - has elevated permissions)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: "profile-images",
  UPLOADS: "uploads",
} as const;

export default supabaseClient;
