import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function test() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data, error } = await supabase.from("fixture_cache").upsert({
    id: 111222,
    league_id: 39,
    home_team_id: 1,
    home_team_name: "Test Home",
    home_team_logo: "logo.png",
    away_team_id: 2,
    away_team_name: "Test Away",
    away_team_logo: "logo2.png",
    kickoff_at: new Date().toISOString(),
    status: "NS",
    raw_data: { test: true },
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }, { onConflict: "id" });

  console.log("Upsert Error:", error);
}

test();
