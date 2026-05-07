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
 * Filter fixtures for major leagues
 */
export function filterMajorLeagues(fixtures: Fixture[]): Fixture[] {
    const majorLeagueIds = [
        39,  // Premier League
        140, // La Liga
        135, // Serie A
        78,  // Bundesliga
        61,  // Ligue 1
        94,  // Primeira Liga
        88,  // Eredivisie
        203, // Süper Lig
        71,  // Brasileirão
        128, // Liga MX
    ];

    return fixtures.filter(f => majorLeagueIds.includes(f.league.id));
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
