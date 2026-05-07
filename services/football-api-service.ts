/**
 * CornerEdge - Football API Service
 * 
 * Service for fetching football data from API-Football
 */

const API_KEY = process.env.EXPO_PUBLIC_API || '1a896aad078a4eec7ab7121281bcd5ec';
const API_BASE_URL = 'https://v3.football.api-sports.io';

interface ApiResponse<T> {
    get: string;
    parameters: any;
    errors: any[];
    results: number;
    paging: {
        current: number;
        total: number;
    };
    response: T;
}

interface Fixture {
    fixture: {
        id: number;
        referee: string | null;
        timezone: string;
        date: string;
        timestamp: number;
        periods: {
            first: number | null;
            second: number | null;
        };
        venue: {
            id: number | null;
            name: string | null;
            city: string | null;
        };
        status: {
            long: string;
            short: string;
            elapsed: number | null;
        };
    };
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string | null;
        season: number;
        round: string;
    };
    teams: {
        home: {
            id: number;
            name: string;
            logo: string;
            winner: boolean | null;
        };
        away: {
            id: number;
            name: string;
            logo: string;
            winner: boolean | null;
        };
    };
    goals: {
        home: number | null;
        away: number | null;
    };
    score: {
        halftime: {
            home: number | null;
            away: number | null;
        };
        fulltime: {
            home: number | null;
            away: number | null;
        };
        extratime: {
            home: number | null;
            away: number | null;
        };
        penalty: {
            home: number | null;
            away: number | null;
        };
    };
}

interface FixtureStatistics {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    statistics: Array<{
        type: string;
        value: number | string | null;
    }>;
}

/**
 * Fetch fixtures for a specific date
 */
export async function fetchFixturesByDate(date: string): Promise<Fixture[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/fixtures?date=${date}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data: ApiResponse<Fixture[]> = await response.json();
        
        if (data.errors && data.errors.length > 0) {
            console.error('[FootballAPI] API Errors:', data.errors);
            throw new Error('API returned errors');
        }

        return data.response || [];
    } catch (error) {
        console.error('[FootballAPI] Error fetching fixtures:', error);
        throw error;
    }
}

/**
 * Fetch statistics for a specific fixture
 */
export async function fetchFixtureStatistics(fixtureId: number): Promise<FixtureStatistics[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/fixtures/statistics?fixture=${fixtureId}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data: ApiResponse<FixtureStatistics[]> = await response.json();
        
        if (data.errors && data.errors.length > 0) {
            console.error('[FootballAPI] API Errors:', data.errors);
            return [];
        }

        return data.response || [];
    } catch (error) {
        console.error('[FootballAPI] Error fetching statistics:', error);
        return [];
    }
}

/**
 * Fetch team statistics for last N matches
 */
export async function fetchTeamLastMatches(teamId: number, last: number = 10): Promise<Fixture[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/fixtures?team=${teamId}&last=${last}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data: ApiResponse<Fixture[]> = await response.json();
        return data.response || [];
    } catch (error) {
        console.error('[FootballAPI] Error fetching team matches:', error);
        return [];
    }
}

/**
 * Get corner statistics from fixture statistics
 */
export function extractCornerStats(statistics: FixtureStatistics[]): {
    home: number;
    away: number;
    total: number;
} {
    let homeCorners = 0;
    let awayCorners = 0;

    for (const teamStats of statistics) {
        const cornerStat = teamStats.statistics.find(s => s.type === 'Corner Kicks');
        if (cornerStat && cornerStat.value !== null) {
            const corners = typeof cornerStat.value === 'number' ? cornerStat.value : parseInt(cornerStat.value as string, 10);
            
            if (statistics.indexOf(teamStats) === 0) {
                homeCorners = corners;
            } else {
                awayCorners = corners;
            }
        }
    }

    return {
        home: homeCorners,
        away: awayCorners,
        total: homeCorners + awayCorners
    };
}

/**
 * Filter fixtures for major leagues — Tier 1 (top 10 ligas)
 * Usado como filtro primário
 */
export function filterMajorLeagues(fixtures: Fixture[]): Fixture[] {
    const tier1LeagueIds = [
        39,  // Premier League (Inglaterra)
        140, // La Liga (Espanha)
        135, // Serie A (Itália)
        78,  // Bundesliga (Alemanha)
        61,  // Ligue 1 (França)
        94,  // Primeira Liga (Portugal)
        88,  // Eredivisie (Holanda)
        203, // Süper Lig (Turquia)
        71,  // Brasileirão Série A
        128, // Liga MX (México)
    ];
    return fixtures.filter(f => tier1LeagueIds.includes(f.league.id));
}

/**
 * Filter fixtures for expanded leagues — Tier 2
 * Usado como fallback quando não há jogos nas ligas Tier 1
 */
export function filterExpandedLeagues(fixtures: Fixture[]): Fixture[] {
    const tier2LeagueIds = [
        // Competições UEFA
        2,   // UEFA Champions League
        3,   // UEFA Europa League
        848, // UEFA Europa Conference League
        // Copa Sul-Americana / Libertadores
        13,  // CONMEBOL Libertadores
        11,  // CONMEBOL Sudamericana
        // Ligas nacionais de qualidade
        253, // MLS (EUA)
        307, // Saudi Pro League (Arábia Saudita)
        169, // Eliteserien (Noruega)
        113, // Allsvenskan (Suécia)
        119, // Superliga (Dinamarca)
        144, // Jupiler Pro League (Bélgica)
        40,  // Championship (Inglaterra)
        103, // Ekstraklasa (Polônia)
        235, // Premier League (Rússia)
        200, // Botola Pro (Marrocos)
        233, // Premier League (Egito)
        188, // Premier League (Arábia Saudita - 2ª)
        197, // Super League (Grécia)
        207, // Super League (Suíça)
        218, // Ligue Professionnelle 1 (Argélia)
        239, // Premier League (Irlanda)
        244, // Premier League (Escócia)
        262, // Liga de Expansión MX
        271, // Superliga (Sérvia)
        283, // Premier League (Ucrânia)
        292, // MLS Next Pro
        327, // Erovnuli Liga (Geórgia)
        333, // Premier League (Cazaquistão)
        345, // Premier League (Azerbaijão)
    ];
    return fixtures.filter(f => tier2LeagueIds.includes(f.league.id));
}

/**
 * Filter fixtures that are scheduled (not started yet)
 */
export function filterScheduledFixtures(fixtures: Fixture[]): Fixture[] {
    return fixtures.filter(f =>
        f.fixture.status.short === 'NS' || // Not Started
        f.fixture.status.short === 'TBD'   // To Be Defined
    );
}

/**
 * Get best available fixtures for today:
 * 1. Tenta Tier 1 (ligas principais)
 * 2. Se < 5 jogos, complementa com Tier 2
 * 3. Ordena por prioridade de liga
 */
export function filterBestAvailableFixtures(fixtures: Fixture[]): Fixture[] {
    const scheduled = filterScheduledFixtures(fixtures);
    const tier1 = filterMajorLeagues(scheduled);

    if (tier1.length >= 5) {
        return tier1;
    }

    // Complementar com Tier 2
    const tier2 = filterExpandedLeagues(scheduled);
    const tier1Ids = new Set(tier1.map(f => f.fixture.id));
    const tier2Only = tier2.filter(f => !tier1Ids.has(f.fixture.id));

    return [...tier1, ...tier2Only];
}
