
const API_KEY = '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'x-rapidapi-key': API_KEY, 'x-rapidapi-host': 'v3.football.api-sports.io' },
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const data = await response.json();
  return data.response || [];
}

async function analyzeTeamCorners(teamId, teamName) {
  console.log(`Analyzing ${teamName} (ID: ${teamId})...`);
  const lastMatches = await fetchFromAPI(`/fixtures?team=${teamId}&last=10`);
  console.log(`Found ${lastMatches.length} last matches`);
  
  let validCount = 0;
  for (const match of lastMatches) {
    if (match.fixture.status.short !== 'FT') {
        console.log(`Match ${match.fixture.id} status: ${match.fixture.status.short} (skipped)`);
        continue;
    }
    const stats = await fetchFromAPI(`/fixtures/statistics?fixture=${match.fixture.id}`);
    if (!stats.length) {
        console.log(`Match ${match.fixture.id} has no stats (skipped)`);
        continue;
    }
    
    let hasCorners = false;
    for (const ts of stats) {
      const cs = ts.statistics.find((s) => s.type === 'Corner Kicks');
      if (cs?.value != null) hasCorners = true;
    }
    
    if (hasCorners) {
        validCount++;
        console.log(`Match ${match.fixture.id} has corner stats`);
    } else {
        console.log(`Match ${match.fixture.id} has no corner stats (skipped)`);
    }
  }
  
  console.log(`Total valid matches for ${teamName}: ${validCount}`);
}

analyzeTeamCorners(165, 'Borussia Dortmund').then(() => console.log('Done'));
