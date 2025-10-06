const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = "https://fypuchrihsqrkkqozgok.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseKey) {
  throw new Error("Missing SUPABASE_KEY environment variable");
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("🔗 Supabase client initialized");

module.exports = supabase;
