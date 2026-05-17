/**
 * Logo Service - Fallback múltiplo para garantir logos dos times
 * Priority: API-Football > Wikimedia > Clearbit > Placeholder
 */

const CLEARBIT_LOGO_API = 'https://logo.clearbit.com';

const TEAM_DOMAIN_MAP: Record<string, string> = {
    'manchester united': 'manutd.com',
    'manchester city': 'mancity.com',
    'liverpool': 'liverpoolfc.com',
    'chelsea': 'chelseafc.com',
    'arsenal': 'arsenal.com',
    'tottenham': 'tottenhamhotspur.com',
    'barcelona': 'fcbarcelona.com',
    'real madrid': 'realmadrid.com',
    'juventus': 'juventus.com',
    'inter': 'inter.it',
    'milan': 'acmilan.com',
    'bayern': 'fcbayern.com',
    'psg': 'psg.fr',
    'porto': 'fcporto.pt',
    'benfica': 'slbenfica.pt',
    'sporting': 'sporting.pt',
    'ajax': 'ajax.nl',
    'flamengo': 'flamengo.com.br',
    'palmeiras': 'palmeiras.com.br',
    'corinthians': 'corinthians.com.br',
};

const TEAM_LOGO_MAP: Record<string, string> = {
    // Brasileirão
    'botafogo': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Botafogo_de_Futebol_e_Regatas_logo.svg',
    'corinthians': 'https://upload.wikimedia.org/wikipedia/commons/6/63/Corinthians_Logo.svg',
    'cruzeiro': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Cruzeiro_Esporte_Clube_logo.svg',
    'flamengo': 'https://upload.wikimedia.org/wikipedia/commons/0/05/CR_Flamengo_logo.png',
    'fluminense': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Fluminense_FC.svg',
    'grêmio': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Grêmio_Football_Porto_Alegrense_logo.svg',
    'internacional': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Sport_Club_Internacional_logo.svg',
    'palmeiras': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Sociedade_Esportiva_Palmeiras_logo.svg',
    'santos': 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Santos_Futebol_Clube_logo.svg',
    'são paulo': 'https://upload.wikimedia.org/wikipedia/commons/1/10/São_Paulo_Futebol_Clube_logo.svg',
    'vasco': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/CR_Vasco_da_Gama_logo.svg',
    'athletico paranaense': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Club_Athletico_Paranaense_2021.svg',
    'atlético mineiro': 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Clube_Atlético_Mineiro_logo.svg',
    'goiás': 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Atlético_Clube_Goiano_logo.png',
    'ceará': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Ceará_Sporting_Club_logo.svg',
    'bahia': 'https://upload.wikimedia.org/wikipedia/commons/0/0a/EC_Bahia_Logo.png',
    'fortaleza': 'https://upload.wikimedia.org/wikipedia/commons/5/53/Fortaleza_Esporte_Clube_logo.png',
    'sport': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Sport_Club_do_Recife_logo.svg',
    'braga': 'https://upload.wikimedia.org/wikipedia/commons/3/35/SC_Braga_logo.svg',
    // Premier League
    'manchester united': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    'manchester city': 'https://upload.wikimedia.org/wikipedia/en/c/c1/Manchester_City_FC_badge.svg',
    'liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    'chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    'arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    'newcastle': 'https://upload.wikimedia.org/wikipedia/en/5/51/Newcastle_United_Logo.svg',
    'man utd': 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    // La Liga
    'barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona.svg',
    'real madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'atlético madrid': 'https://upload.wikimedia.org/wikipedia/en/7/72/Atletico_Madrid_2021.svg',
    'sevilla': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
    'villarreal': 'https://upload.wikimedia.org/wikipedia/en/3/3a/Villarreal_CF_logo.svg',
    'real betis': 'https://upload.wikimedia.org/wikipedia/en/0/0d/Real_Betis_logo.svg',
    'athletic bilbao': 'https://upload.wikimedia.org/wikipedia/en/4/45/Athletic_Club_Bilbao_logo.svg',
    'real sociedad': 'https://upload.wikimedia.org/wikipedia/en/c/c8/Real_Sociedad_logo.svg',
    'girona': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Girona_FC_Logo.png',
    'valencia': 'https://upload.wikimedia.org/wikipedia/en/7/7e/Valencia_CF_logo.svg',
    'celta': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Celta_Vigo_logo.svg',
    'espanyol': 'https://upload.wikimedia.org/wikipedia/en/9/9a/RCD_Espanyol_logo.svg',
    'osasuna': 'https://upload.wikimedia.org/wikipedia/en/2/21/CA_Osasuna_logo.svg',
    'mallorca': 'https://upload.wikimedia.org/wikipedia/en/1/1e/RCD_Mallorca_logo.svg',
    // Serie A
    'juventus': 'https://upload.wikimedia.org/wikipedia/en/b/bc/Juventus_FC_logo.svg',
    'inter': 'https://upload.wikimedia.org/wikipedia/en/0/0a/Inter_Milan_2021.svg',
    'milan': 'https://upload.wikimedia.org/wikipedia/en/d/d0/AC_Milan_Logo.svg',
    'roma': 'https://upload.wikimedia.org/wikipedia/en/f/f6/AS_Roma_logo.svg',
    'napoli': 'https://upload.wikimedia.org/wikipedia/en/2/2d/SSC_Napoli_2021.svg',
    'lazio': 'https://upload.wikimedia.org/wikipedia/en/c/c6/S.S._Lazio_logo.svg',
    'atalanta': 'https://upload.wikimedia.org/wikipedia/en/3/3b/Atalanta_Bergamo_Logo.svg',
    'fiorentina': 'https://upload.wikimedia.org/wikipedia/en/8/8e/AC_Fiorentina_Logo.svg',
    'torino': 'https://upload.wikimedia.org/wikipedia/en/2/2b/Torino_FC_Logo.svg',
    // Bundesliga
    'bayern': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg',
    'bayern munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_%282017%29.svg',
    'borussia dortmund': 'https://upload.wikimedia.org/wikipedia/en/6/67/Borussia_Dortmund_logo.svg',
    'dortmund': 'https://upload.wikimedia.org/wikipedia/en/6/67/Borussia_Dortmund_logo.svg',
    'leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/53/Bayer_04_Leverkusen_logo.svg',
    'rb leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_Logo.svg',
    'leipzig': 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_Logo.svg',
    'schalke': 'https://upload.wikimedia.org/wikipedia/en/1/16/FC_Schalke_04_logo.svg',
    'eintracht frankfurt': 'https://upload.wikimedia.org/wikipedia/en/0/04/Eintracht_Frankfurt_Logo.svg',
    'mönchengladbach': 'https://upload.wikimedia.org/wikipedia/en/8/8c/Borussia_Mönchengladbach_logo.svg',
    // Ligue 1
    'psg': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_FC.svg',
    'marseille': 'https://upload.wikimedia.org/wikipedia/en/4/4d/Olympique_Marseille_logo.svg',
    'lyon': 'https://upload.wikimedia.org/wikipedia/en/8/8b/Olympique_Lyon_logo.svg',
    'monaco': 'https://upload.wikimedia.org/wikipedia/en/2/2e/AS_Monaco_FC.svg',
    'lille': 'https://upload.wikimedia.org/wikipedia/en/5/57/Lille_OSC_logo.svg',
    'nice': 'https://upload.wikimedia.org/wikipedia/en/b/b9/OGC_Nice_logo.svg',
    // Primeira Liga
    'porto': 'https://upload.wikimedia.org/wikipedia/en/0/0c/FC_Porto.svg',
    'sporting': 'https://upload.wikimedia.org/wikipedia/en/c/c0/Sporting_Club_de_Portugal.png',
    'benfica': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_2021.svg',
    // Eredivisie
    'ajax': 'https://upload.wikimedia.org/wikipedia/en/7/7d/AFC_Ajax_logo.svg',
    'feyenoord': 'https://upload.wikimedia.org/wikipedia/en/4/4a/Feyenoord_logo.svg',
    'psv': 'https://upload.wikimedia.org/wikipedia/en/5/53/PSV_Eindhoven_logo.svg',
};

function normalizeTeamName(name: string): string {
    if (!name) return '';
    return name.toLowerCase().trim()
        .replace(/fc$/i, '')
        .replace(/cf$/i, '')
        .replace(/sc$/i, '')
        .replace(/cr$/i, '')
        .replace(/ss$/i, '')
        .replace(/ac$/i, '')
        .replace(/fk$/i, '')
        .replace(/bk$/i, '')
        .replace(/sk$/i, '')
        .replace(/sp$.*/i, '')
        .replace(/club$/i, '')
        .replace(/futebol$/i, '')
        .replace(/esporte$/i, '')
        .replace(/de$/i, '')
        .replace(/da$/i, '')
        .replace(/do$/i, '')
        .replace(/el$/i, '')
        .replace(/la$/i, '')
        .replace(/las$/i, '')
        .replace(/los$/i, '')
        .replace(/the$/i, '')
        .replace(/team$/i, '')
        .replace(/  +/g, ' ')
        .trim();
}

export function getTeamLogoFallback(teamName: string, apiSportsLogo?: string): string {
    if (apiSportsLogo && isValidUrl(apiSportsLogo)) {
        return apiSportsLogo;
    }

    if (!teamName) return '';

    const normalizedName = normalizeTeamName(teamName);
    
    // Try exact match first
    if (TEAM_LOGO_MAP[normalizedName]) {
        return TEAM_LOGO_MAP[normalizedName];
    }

    // Try partial match
    for (const [key, logo] of Object.entries(TEAM_LOGO_MAP)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return logo;
        }
    }

    // Try Clearbit fallback
    for (const [key, domain] of Object.entries(TEAM_DOMAIN_MAP)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
            return `${CLEARBIT_LOGO_API}/${domain}`;
        }
    }

    return '';
}

function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export function getTeamInitials(teamName: string): string {
    if (!teamName) return '?';
    const words = teamName.split(' ').filter(w => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
}