// =========================================================
// FRONTEND Supabase client.
// Uses the "anon" key, which is SAFE to put in browser code —
// it's designed to be public. Never put the service_role key
// here, only ever in the backend (.env file).
//
// REPLACE the two placeholders below with your real values
// from Supabase → Project Settings → API.
// =========================================================

const SUPABASE_URL = "https://pesnnejrsrmzangnewmp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlc25uZWpyc3JtemFuZ25ld21wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzQ2ODYsImV4cCI6MjEwMTAxMDY4Nn0.zllHJLTYPTTPwWEytUES0O7ZaRn6iRBu5C-BdVrsT5s";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);