// Mock data para desenvolvimento frontend
// Substituir por chamadas Supabase após integração

export interface PickSelection {
    id: string;
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    leagueId: number;
    market: string;
    marketBetId: number;
    odd: number;
    confidence: number;
    reasons: { pt: string[]; en: string[]; es: string[] };
    status: 'pending' | 'green' | 'red' | 'void';
    kickoffAt: string;
}

export interface DailyPick {
    id: string;
    date: string;
    tier: 'free' | 'premium';
    combinedOdd: number;
    confidenceAvg: number;
    status: 'pending' | 'green' | 'red' | 'void';
    selections: PickSelection[];
}

export interface Fixture {
    id: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    leagueId: number;
    kickoffAt: string;
    homeLogo?: string;
    awayLogo?: string;
}

export interface DailyStats {
    date: string;
    tier: 'free' | 'premium';
    totalPicks: number;
    greenPicks: number;
    redPicks: number;
    hitRate: number;
    roi: number;
}

// Mock picks de exemplo
export const mockDailyPicks: DailyPick[] = [
    {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        tier: 'free',
        combinedOdd: 2.05,
        confidenceAvg: 68,
        status: 'pending',
        selections: [
            {
                id: 's1',
                fixtureId: 215662,
                homeTeam: 'Arsenal',
                awayTeam: 'Chelsea',
                league: 'Premier League',
                leagueId: 39,
                market: 'Over 2.5 Goals',
                marketBetId: 5,
                odd: 1.45,
                confidence: 72,
                reasons: {
                    pt: ['Arsenal marcou em 5 dos últimos 5 jogos em casa', 'H2H: Over 2.5 em 8 dos últimos 10 confrontos'],
                    en: ['Arsenal scored in 5 of last 5 home games', 'H2H: Over 2.5 in 8 of last 10 meetings'],
                    es: ['Arsenal marcó en 5 de los últimos 5 partidos en casa', 'H2H: Over 2.5 en 8 de los últimos 10 partidos']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's2',
                fixtureId: 215663,
                homeTeam: 'Liverpool',
                awayTeam: 'Newcastle',
                league: 'Premier League',
                leagueId: 39,
                market: 'BTTS',
                marketBetId: 8,
                odd: 1.38,
                confidence: 65,
                reasons: {
                    pt: ['Ambos times marcaram em 4 dos últimos 5 jogos do Liverpool'],
                    en: ['Both teams scored in 4 of Liverpool last 5 games'],
                    es: ['Ambos equipos marcaron en 4 de los últimos 5 partidos del Liverpool']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's3',
                fixtureId: 215664,
                homeTeam: 'Man United',
                awayTeam: 'Tottenham',
                league: 'Premier League',
                leagueId: 39,
                market: 'Double Chance 1X',
                marketBetId: 3,
                odd: 1.01,
                confidence: 67,
                reasons: {
                    pt: ['United sem derrotas em 8 jogos em Old Trafford'],
                    en: ['United undefeated in 8 games at Old Trafford'],
                    es: ['United invicto en 8 partidos en Old Trafford']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
            }
        ]
    },
    {
        id: '2',
        date: new Date().toISOString().split('T')[0],
        tier: 'free',
        combinedOdd: 1.95,
        confidenceAvg: 71,
        status: 'pending',
        selections: [
            {
                id: 's4',
                fixtureId: 215665,
                homeTeam: 'Barcelona',
                awayTeam: 'Real Madrid',
                league: 'La Liga',
                leagueId: 140,
                market: 'Over 1.5',
                marketBetId: 5,
                odd: 1.28,
                confidence: 74,
                reasons: {
                    pt: ['Média de 3.2 golos/clássico nos últimos 10 jogos'],
                    en: ['Average 3.2 goals/Clásico in last 10 games'],
                    es: ['Promedio 3.2 goles/Clásico en los últimos 10 partidos']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's5',
                fixtureId: 215666,
                homeTeam: 'Atletico Madrid',
                awayTeam: 'Sevilla',
                league: 'La Liga',
                leagueId: 140,
                market: 'Double Chance X2',
                marketBetId: 3,
                odd: 1.42,
                confidence: 68,
                reasons: {
                    pt: ['Sevilla sofreu apenas 2 golos nos últimos 5 jogos fora'],
                    en: ['Sevilla conceded only 2 goals in last 5 away games'],
                    es: ['Sevilla solo recibió 2 goles en los últimos 5 partidos fuera']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's6',
                fixtureId: 215667,
                homeTeam: 'Villarreal',
                awayTeam: 'Athletic Bilbao',
                league: 'La Liga',
                leagueId: 140,
                market: 'BTTS',
                marketBetId: 8,
                odd: 1.08,
                confidence: 71,
                reasons: {
                    pt: ['BTTS em 4 dos últimos 5 jogos do Villarreal'],
                    en: ['BTTS in 4 of Villarreal last 5 games'],
                    es: ['BTTS en 4 de los últimos 5 partidos del Villarreal']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
            }
        ]
    },
    {
        id: '3',
        date: new Date().toISOString().split('T')[0],
        tier: 'premium',
        combinedOdd: 2.40,
        confidenceAvg: 78,
        status: 'pending',
        selections: [
            {
                id: 's7',
                fixtureId: 215668,
                homeTeam: 'Bayern Munich',
                awayTeam: 'Dortmund',
                league: 'Bundesliga',
                leagueId: 78,
                market: 'Over 2.5',
                marketBetId: 5,
                odd: 1.32,
                confidence: 82,
                reasons: {
                    pt: ['Bayern média 3.1 golos em casa', 'Clássico com média 3.5 golos'],
                    en: ['Bayern average 3.1 goals at home', 'Clásico averaging 3.5 goals'],
                    es: ['Bayern promedio 3.1 goles en casa', 'Clásico con promedio 3.5 goles']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's8',
                fixtureId: 215669,
                homeTeam: 'PSG',
                awayTeam: 'Monaco',
                league: 'Ligue 1',
                leagueId: 61,
                market: 'HT Over 0.5',
                marketBetId: 57,
                odd: 1.45,
                confidence: 76,
                reasons: {
                    pt: ['PSG marcou no 1º tempo em 9 dos últimos 10 jogos'],
                    en: ['PSG scored in 1st half in 9 of last 10 games'],
                    es: ['PSG marcó en el primer tiempo en 9 de los últimos 10 partidos']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's9',
                fixtureId: 215670,
                homeTeam: 'Inter',
                awayTeam: 'AC Milan',
                league: 'Serie A',
                leagueId: 135,
                market: 'Double Chance 1X',
                marketBetId: 3,
                odd: 1.25,
                confidence: 76,
                reasons: {
                    pt: ['Inter imbatível em 12 clássicos em San Siro'],
                    en: ['Inter undefeated in 12 derbies at San Siro'],
                    es: ['Inter invicto en 12 derbis en San Siro']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
            }
        ]
    },
    {
        id: '4',
        date: new Date().toISOString().split('T')[0],
        tier: 'premium',
        combinedOdd: 3.15,
        confidenceAvg: 81,
        status: 'pending',
        selections: [
            {
                id: 's10',
                fixtureId: 215671,
                homeTeam: 'Flamengo',
                awayTeam: 'Palmeiras',
                league: 'Brasileirão',
                leagueId: 71,
                market: 'Over 2.5',
                marketBetId: 5,
                odd: 1.55,
                confidence: 85,
                reasons: {
                    pt: ['Clássico dos Milhões média 2.8 golos', 'Flamengo 80% jogos com over 2.5'],
                    en: ['Clássico dos Milhões averaging 2.8 goals', 'Flamengo 80% games with over 2.5'],
                    es: ['Clásico dos Milhões promedio 2.8 goles', 'Flamengo 80% partidos con over 2.5']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's11',
                fixtureId: 215672,
                homeTeam: 'Corinthians',
                awayTeam: 'São Paulo',
                league: 'Brasileirão',
                leagueId: 71,
                market: 'BTTS',
                marketBetId: 8,
                odd: 1.65,
                confidence: 79,
                reasons: {
                    pt: ['D derby com BTTS em 7 dos últimos 10 jogos'],
                    en: ['Derby with BTTS in 7 of last 10 games'],
                    es: ['Derby con BTTS en 7 de los últimos 10 partidos']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 's12',
                fixtureId: 215673,
                homeTeam: 'Santos',
                awayTeam: 'Cruzeiro',
                league: 'Brasileirão',
                leagueId: 71,
                market: 'DC 1X',
                marketBetId: 3,
                odd: 1.23,
                confidence: 79,
                reasons: {
                    pt: ['Santos imbatível em 6 jogos em casa'],
                    en: ['Santos undefeated in 6 home games'],
                    es: ['Santos invicto en 6 partidos en casa']
                },
                status: 'pending',
                kickoffAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
            }
        ]
    }
];

// Mock tomorrow fixtures
export const mockTomorrowFixtures: Fixture[] = [
    { id: 301, homeTeam: 'Arsenal', awayTeam: 'Chelsea', league: 'Premier League', leagueId: 39, kickoffAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString() },
    { id: 302, homeTeam: 'Liverpool', awayTeam: 'Newcastle', league: 'Premier League', leagueId: 39, kickoffAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString() },
    { id: 303, homeTeam: 'Barcelona', awayTeam: 'Real Madrid', league: 'La Liga', leagueId: 140, kickoffAt: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString() },
    { id: 304, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', league: 'Bundesliga', leagueId: 78, kickoffAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString() },
    { id: 305, homeTeam: 'PSG', awayTeam: 'Monaco', league: 'Ligue 1', leagueId: 61, kickoffAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString() },
    { id: 306, homeTeam: 'Inter', awayTeam: 'AC Milan', league: 'Serie A', leagueId: 135, kickoffAt: new Date(Date.now() + 30 * 60 * 60 * 1000).toISOString() },
    { id: 307, homeTeam: 'Flamengo', awayTeam: 'Palmeiras', league: 'Brasileirão', leagueId: 71, kickoffAt: new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString() },
    { id: 308, homeTeam: 'Ajax', awayTeam: 'Feyenoord', league: 'Eredivisie', leagueId: 88, kickoffAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString() },
];

// Mock historical results
export const mockHistoricalPicks: { date: string; picks: DailyPick[] }[] = [
    {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        picks: [
            {
                id: 'h1',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tier: 'free',
                combinedOdd: 2.10,
                confidenceAvg: 70,
                status: 'green',
                selections: [
                    { ...mockDailyPicks[0].selections[0], status: 'green' as const },
                    { ...mockDailyPicks[0].selections[1], status: 'green' as const },
                    { ...mockDailyPicks[0].selections[2], status: 'green' as const }
                ]
            },
            {
                id: 'h2',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tier: 'free',
                combinedOdd: 1.85,
                confidenceAvg: 68,
                status: 'red',
                selections: [
                    { ...mockDailyPicks[1].selections[0], status: 'green' as const },
                    { ...mockDailyPicks[1].selections[1], status: 'red' as const },
                    { ...mockDailyPicks[1].selections[2], status: 'green' as const }
                ]
            }
        ]
    },
    {
        date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
        picks: [
            {
                id: 'h3',
                date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0],
                tier: 'free',
                combinedOdd: 2.05,
                confidenceAvg: 72,
                status: 'green',
                selections: [
                    { ...mockDailyPicks[0].selections[0], status: 'green' as const },
                    { ...mockDailyPicks[0].selections[1], status: 'green' as const },
                    { ...mockDailyPicks[0].selections[2], status: 'green' as const }
                ]
            }
        ]
    }
];

// Mock user stats
export const mockUserStats = {
    totalPicks: 156,
    hitRate7Days: 72,
    hitRateAllTime: 68,
    roi: 24,
};

// Mock subscription status
export const mockSubscription = {
    tier: 'free' as 'free' | 'premium',
    expiresAt: null,
};