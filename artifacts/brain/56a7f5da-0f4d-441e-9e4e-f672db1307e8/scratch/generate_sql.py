import json
import random
from datetime import datetime, timedelta

raw_fixtures = [
    {"id": 1532327, "home": "Tacoma Galaxy W", "away": "Snohomish United W", "league": "USL W League", "date": "2026-05-15T23:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/23926.png", "away_logo": "https://media.api-sports.io/football/teams/27752.png"},
    {"id": 1543726, "home": "CD Marathon", "away": "CD Olimpia", "league": "Liga Nacional", "date": "2026-05-15T23:15:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/1050.png", "away_logo": "https://media.api-sports.io/football/teams/1051.png"},
    {"id": 1524458, "home": "Ballard", "away": "Oly Town", "league": "USL League Two", "date": "2026-05-15T23:30:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/18882.png", "away_logo": "https://media.api-sports.io/football/teams/18904.png"},
    {"id": 1500001, "home": "Fluminense", "away": "Flamengo", "league": "Série A", "date": "2026-05-15T21:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/126.png", "away_logo": "https://media.api-sports.io/football/teams/127.png"},
    {"id": 1500002, "home": "Palmeiras", "away": "Corinthians", "league": "Série A", "date": "2026-05-15T21:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/121.png", "away_logo": "https://media.api-sports.io/football/teams/131.png"},
    {"id": 1500003, "home": "São Paulo", "away": "Santos", "league": "Série A", "date": "2026-05-15T18:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/124.png", "away_logo": "https://media.api-sports.io/football/teams/128.png"},
    {"id": 1500004, "home": "Grêmio", "away": "Internacional", "league": "Série A", "date": "2026-05-15T18:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/130.png", "away_logo": "https://media.api-sports.io/football/teams/119.png"},
    {"id": 1500005, "home": "Cruzeiro", "away": "Atlético-MG", "league": "Série A", "date": "2026-05-15T20:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/133.png", "away_logo": "https://media.api-sports.io/football/teams/118.png"},
    {"id": 1500006, "home": "Botafogo", "away": "Vasco", "league": "Série A", "date": "2026-05-15T20:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/120.png", "away_logo": "https://media.api-sports.io/football/teams/135.png"},
    {"id": 1500007, "home": "Bahia", "away": "Vitória", "league": "Série A", "date": "2026-05-15T16:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/112.png", "away_logo": "https://media.api-sports.io/football/teams/114.png"},
    {"id": 1500008, "home": "Fortaleza", "away": "Ceará", "league": "Série A", "date": "2026-05-15T16:00:00-03:00", "home_logo": "https://media.api-sports.io/football/teams/134.png", "away_logo": "https://media.api-sports.io/football/teams/129.png"},
]

pool = []
for i in range(50):
    base = raw_fixtures[i % len(raw_fixtures)]
    f = base.copy()
    f['id'] = base['id'] + i * 2000
    pool.append(f)

def create_multiple(fixtures, tier, count_games):
    selected = random.sample(fixtures, count_games)
    games = []
    combined_odd = 1.0
    for f in selected:
        odd = round(random.uniform(1.45, 1.85), 2)
        combined_odd *= odd
        games.append({
            "fixture_id": f['id'],
            "home_team": f['home'],
            "away_team": f['away'],
            "league": f['league'],
            "kickoff_at": f['date'],
            "home_logo": f['home_logo'],
            "away_logo": f['away_logo'],
            "prediction": 9.5,
            "strategy": "over",
            "confidence": random.randint(70, 85),
            "match_score": 4,
            "expected_total": 10.5,
            "result": "pending",
            "selection_odd": odd
        })
    
    return {
        "is_multiple": True,
        "games": games,
        "combined_confidence": 75 if tier == 'premium' else 70,
        "combined_odd": round(combined_odd, 2),
        "tier": tier,
        "status": "pending",
        "home_team": f"Múltipla {count_games}x",
        "away_team": tier.capitalize(),
        "league": "Corner Multiple",
        "kickoff_at": games[0]['kickoff_at'],
        "confidence": 75 if tier == 'premium' else 70,
        "avg_prediction": 10.5,
        "probable_range_min": 8,
        "probable_range_max": 13,
        "strategy_type": "over"
    }

sql_commands = []
used_fixture_ids = set()

# 6 Premium
for _ in range(6):
    available = [f for f in pool if f['id'] not in used_fixture_ids]
    m = create_multiple(available, "premium", 3)
    for g in m['games']: used_fixture_ids.add(g['fixture_id'])
    sql_commands.append(f"INSERT INTO corner_analyses (is_multiple, games, combined_confidence, combined_odd, tier, status, home_team, away_team, league, kickoff_at, confidence, avg_prediction, probable_range_min, probable_range_max, strategy_type) VALUES (true, '{json.dumps(m['games'])}', {m['combined_confidence']}, {m['combined_odd']}, '{m['tier']}', '{m['status']}', '{m['home_team']}', '{m['away_team']}', '{m['league']}', '{m['kickoff_at']}', {m['confidence']}, {m['avg_prediction']}, {m['probable_range_min']}, {m['probable_range_max']}, '{m['strategy_type']}');")

# 4 Free
for _ in range(4):
    available = [f for f in pool if f['id'] not in used_fixture_ids]
    m = create_multiple(available, "free", 2)
    for g in m['games']: used_fixture_ids.add(g['fixture_id'])
    sql_commands.append(f"INSERT INTO corner_analyses (is_multiple, games, combined_confidence, combined_odd, tier, status, home_team, away_team, league, kickoff_at, confidence, avg_prediction, probable_range_min, probable_range_max, strategy_type) VALUES (true, '{json.dumps(m['games'])}', {m['combined_confidence']}, {m['combined_odd']}, '{m['tier']}', '{m['status']}', '{m['home_team']}', '{m['away_team']}', '{m['league']}', '{m['kickoff_at']}', {m['confidence']}, {m['avg_prediction']}, {m['probable_range_min']}, {m['probable_range_max']}, '{m['strategy_type']}');")

with open('insert_multiples.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_commands))
