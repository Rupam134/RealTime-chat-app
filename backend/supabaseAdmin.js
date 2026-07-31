// =========================================================
// BACKEND-ONLY Supabase client.
// Uses the service_role key, which can bypass all security
// rules — that's why this file only ever runs on the server,
// never gets sent to the browser.
// =========================================================

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabaseAdmin;