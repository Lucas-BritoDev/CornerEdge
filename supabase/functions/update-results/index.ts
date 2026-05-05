// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const API_KEY = Deno.env.get("API_FOOTBALL_KEY") ?? "1a896aad078a4eec7ab7121281bcd5ec";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const API_BASE = "https://v3.football.api-sports.io";

async function fetchFixtureResult(fixtureId: number) {
  const res = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`, {
    headers: { "x-apisports-key": API_KEY },
  });
  const json = await res.json();
  return json.response?.[0] ?? null;
}

function evaluateSelection(sel: any, fixture: any): "won" | "lost" | "void" | "pending" {
  const status = fixture?.fixture?.status?.short;
  if (!status || !["FT", "AET", "PEN"].includes(status)) return "pending";

  const home = fixture.goals?.home ?? 0;
  const away = fixture.goals?.away ?? 0;
  const total = home + away;
  const htHome = fixture.score?.halftime?.home ?? 0;
  const htAway = fixture.score?.halftime?.away ?? 0;
  const htTotal = htHome + htAway;

  const market = sel.market;
  const selection = sel.selection;

  if (market === "Over 2.5 Goals") return total > 2.5 ? "won" : "lost";
  if (market === "Over 1.5 Goals") return total > 1.5 ? "won" : "lost";
  if (market === "Under 2.5 Goals") return total < 2.5 ? "won" : "lost";
  if (market === "BTTS") return (home > 0 && away > 0) ? "won" : "lost";
  if (market === "HT Over 0.5") return htTotal > 0.5 ? "won" : "lost";
  if (market === "Double Chance 1X") return (home >= away) ? "won" : "lost";
  if (market === "Double Chance X2") return (away >= home) ? "won" : "lost";

  return "void";
}

Deno.serve(async () => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Buscar seleções pendentes dos últimos 2 dias
    const { data: pendingSelections } = await supabase
      .from("pick_selections")
      .select("*, daily_picks!inner(pick_date)")
      .eq("status", "pending")
      .gte("daily_picks.pick_date", yesterday)
      .not("fixture_id", "is", null);

    if (!pendingSelections || pendingSelections.length === 0) {
      return new Response(JSON.stringify({ message: "No pending selections", updated: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const fixtureIds = Array.from(new Set(pendingSelections.map((s: any) => s.fixture_id)));
    const fixtureResults: Record<number, any> = {};

    for (const fid of fixtureIds) {
      fixtureResults[fid] = await fetchFixtureResult(fid);
      await new Promise(r => setTimeout(r, 200));
    }

    let updated = 0;
    for (const sel of pendingSelections) {
      const fixture = fixtureResults[sel.fixture_id];
      if (!fixture) continue;

      const result = evaluateSelection(sel, fixture);
      if (result === "pending") continue;

      // Atualizar fixture_cache com placar
      await supabase.from("fixture_cache").update({
        status: fixture.fixture.status.short,
        score_home: fixture.goals.home,
        score_away: fixture.goals.away,
      }).eq("id", sel.fixture_id);

      // Atualizar seleção
      await supabase.from("pick_selections").update({
        status: result,
        score_home: fixture.goals.home,
        score_away: fixture.goals.away,
      }).eq("id", sel.id);

      updated++;
    }

    // Atualizar status dos daily_picks baseado nas seleções
    const { data: picksDates } = await supabase
      .from("daily_picks")
      .select("id, pick_date")
      .gte("pick_date", yesterday)
      .eq("status", "pending");

    for (const pick of (picksDates ?? [])) {
      const { data: sels } = await supabase
        .from("pick_selections")
        .select("status")
        .eq("daily_pick_id", pick.id);

      if (!sels || sels.length === 0) continue;
      const allDone = sels.every((s: any) => s.status !== "pending");
      if (!allDone) continue;

      const anyLost = sels.some((s: any) => s.status === "lost");
      const allVoid = sels.every((s: any) => s.status === "void");
      const newStatus = allVoid ? "void" : anyLost ? "lost" : "won";

      await supabase.from("daily_picks").update({
        status: newStatus,
        settled_at: new Date().toISOString(),
      }).eq("id", pick.id);
    }

    return new Response(JSON.stringify({ success: true, updated }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
