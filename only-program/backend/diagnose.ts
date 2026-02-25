import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log("🔍 Starting diagnostic...");

  // 1. Check temp_otps table
  console.log("Checking 'temp_otps' table...");
  const { data, error } = await supabase
    .from("temp_otps")
    .select("id")
    .limit(1);
  if (error) {
    if (error.code === "PGRST116" || error.message.includes("not found")) {
      console.error("❌ Table 'temp_otps' is STILL MISSING!");
    } else {
      console.error("❌ Error querying 'temp_otps':", error.message);
    }
  } else {
    console.log("✅ 'temp_otps' table exists.");
  }

  // 2. Check profiles table (Control)
  console.log("Checking 'profiles' table...");
  const { error: pError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);
  if (pError) {
    console.error("❌ Error querying 'profiles':", pError.message);
  } else {
    console.log("✅ 'profiles' table exists.");
  }

  console.log("🏁 Diagnostic complete.");
}

diagnose();
