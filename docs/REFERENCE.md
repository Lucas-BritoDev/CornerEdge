# Referência Rápida - CornerEdge

Guia de referência rápida para desenvolvimento e manutenção.

## 🗂️ Estrutura de Arquivos

```
corneredge/
├── app/
│   └── (tabs)/
│       ├── index.tsx          # Home - Análises de Hoje
│       ├── results.tsx        # Resultados
│       ├── premium.tsx        # Premium
│       └── profile.tsx        # Perfil
├── services/
│   ├── football-api-service.ts      # API-Football
│   ├── corner-analysis-algorithm.ts # Algoritmo
│   └── analyses-service.ts          # Camada de dados
├── types/
│   └── index.ts               # TypeScript types
├── locales/
│   ├── pt.json               # Português
│   ├── en.json               # Inglês
│   └── es.json               # Espanhol
├── constants/
│   └── theme.ts              # Cores e tema
├── docs/
│   ├── QUICK_START.md        # Início rápido
│   ├── CRON_SETUP.md         # Configuração cron
│   ├── SQL_QUERIES.md        # Queries úteis
│   ├── NEXT_STEPS.md         # Próximos passos
│   └── REFERENCE.md          # Este arquivo
├── scripts/
│   ├── test-edge-functions.sh   # Teste Bash
│   └── test-edge-functions.ps1  # Teste PowerShell
├── .env                      # Variáveis de ambiente
├── app.config.js             # Configuração Expo
├── package.json              # Dependências
├── README.md                 # Documentação principal
└── CHANGELOG.md              # Histórico
```

## 🔑 Variáveis de Ambiente

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://[projeto].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# API-Football
EXPO_PUBLIC_API=1a896aad078a4eec7ab7121281bcd5ec

# RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=[sua-chave]
```

## 📊 Estrutura do Banco

### corner_analyses
```sql
id                  uuid PRIMARY KEY
fixture_id          integer          -- ID da API-Football
home_team           text
away_team           text
home_team_logo      text
away_team_logo      text
league              text
kickoff_at          timestamptz
confidence          integer          -- 75-95
avg_prediction      numeric(4,1)     -- Ex: 10.2
probable_range_min  integer          -- Ex: 9
probable_range_max  integer          -- Ex: 11
tier                text             -- 'free' ou 'premium'
status              text             -- 'pending', 'correct', 'incorrect'
actual_corners      integer          -- Resultado real
published_at        timestamptz
created_at          timestamptz
updated_at          timestamptz
```

### robust_scenarios
```sql
id            uuid PRIMARY KEY
analysis_id   uuid REFERENCES corner_analyses
threshold     integer          -- Ex: 7, 8, 9
stability     text             -- 'very_stable', 'stable', 'moderate'
probability   integer          -- 0-100
created_at    timestamptz
```

### statistical_distribution
```sql
id            uuid PRIMARY KEY
analysis_id   uuid REFERENCES corner_analyses
threshold     integer          -- 5-12
probability   integer          -- 0-100
created_at    timestamptz
```

### team_statistics
```sql
id                    uuid PRIMARY KEY
analysis_id           uuid REFERENCES corner_analyses
team_type             text    -- 'home' ou 'away'
offensive_avg         numeric(4,1)
home_intensity        numeric(4,1)
away_intensity        numeric(4,1)
consistency           integer
pressure_conceded     numeric(4,1)
corners_conceded_avg  numeric(4,1)
created_at            timestamptz
```

## 🔄 Fluxo de Dados

### Geração de Análises
```
API-Football
    ↓ fetchFixturesByDate()
Fixtures do dia
    ↓ filterMajorLeagues()
Ligas principais
    ↓ filterScheduledFixtures()
Jogos agendados
    ↓ analyzeTeamCorners()
Estatísticas dos times
    ↓ calculatePrediction()
Previsões calculadas
    ↓ generateTodayAnalyses()
Inserir no Supabase
    ↓
App (useTodayAnalyses)
```

### Atualização de Resultados
```
Supabase (análises pendentes)
    ↓ fetchFixtureStatistics()
Estatísticas do jogo
    ↓ extractCornerStats()
Escanteios reais
    ↓ updateAnalysisResults()
Comparar com previsão
    ↓
Atualizar status
    ↓
App (refresh)
```

## 🎨 Paleta de Cores

```typescript
// constants/theme.ts
export const COLORS = {
  primary: '#FF6B00',      // Orange
  background: '#1A1A1A',   // Black
  text: '#FFFFFF',         // White
  textSecondary: '#666666', // Gray
  success: '#10B981',      // Green
  error: '#EF4444',        // Red
  warning: '#F59E0B',      // Yellow
};
```

## 📱 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar app
npm start

# Limpar cache
npm start -- --clear

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

### Build
```bash
# Build desenvolvimento
eas build --profile development --platform android
eas build --profile development --platform ios

# Build produção
eas build --profile production --platform android
eas build --profile production --platform ios
```

### Testes
```bash
# Testar Edge Functions (Windows)
.\scripts\test-edge-functions.ps1 both

# Testar Edge Functions (Linux/Mac)
./scripts/test-edge-functions.sh both
```

## 🔧 Edge Functions

### URLs
```
Generate: https://[projeto].supabase.co/functions/v1/generate-daily-analyses
Update:   https://[projeto].supabase.co/functions/v1/update-results
```

### Testar via curl
```bash
# Gerar análises
curl -X POST \
  https://[projeto].supabase.co/functions/v1/generate-daily-analyses \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json"

# Atualizar resultados
curl -X POST \
  https://[projeto].supabase.co/functions/v1/update-results \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json"
```

## 📊 Queries SQL Rápidas

### Ver análises de hoje
```sql
SELECT * FROM corner_analyses 
WHERE DATE(published_at) = CURRENT_DATE 
ORDER BY kickoff_at;
```

### Estatísticas do dia
```sql
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE;
```

### Taxa de acerto
```sql
SELECT 
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE;
```

### Ver cron jobs
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 🌍 Ligas Suportadas

```typescript
const MAJOR_LEAGUE_IDS = [
  39,  // Premier League (Inglaterra)
  140, // La Liga (Espanha)
  135, // Serie A (Itália)
  78,  // Bundesliga (Alemanha)
  61,  // Ligue 1 (França)
  94,  // Primeira Liga (Portugal)
  88,  // Eredivisie (Holanda)
  203, // Süper Lig (Turquia)
  71,  // Brasileirão (Brasil)
  128, // Liga MX (México)
];
```

## 🔐 Permissões RLS

### corner_analyses
```sql
-- Leitura pública
SELECT: true

-- Escrita autenticada
INSERT: auth.role() = 'authenticated'
UPDATE: auth.role() = 'authenticated'
DELETE: auth.role() = 'authenticated'
```

## 📈 Métricas de Performance

### Cache
- Análises de hoje: 5 minutos
- Análises por data: 10 minutos
- Estatísticas: 5 minutos

### Limites
- Análises por dia: 8
- Análises FREE: 2
- Análises PREMIUM: 6

### Timing
- Geração: ~2-3 minutos
- Atualização: ~30-60 segundos
- Cache hit: <100ms
- Cache miss: ~500ms

## 🐛 Debugging

### Logs do App
```typescript
console.log('[Service] Mensagem');
```

### Logs do Supabase
1. Dashboard → Edge Functions → Logs
2. Filtrar por função
3. Ver erros e warnings

### Logs do Cron
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'generate-daily-analyses')
ORDER BY start_time DESC 
LIMIT 10;
```

## 🔄 Horários dos Cron Jobs

```
Geração:     06:00 BRT (09:00 UTC) - Cron: 0 9 * * *
Atualização: 23:00 BRT (02:00 UTC) - Cron: 0 2 * * *
```

### Converter Horários
```
BRT = UTC - 3 horas
06:00 BRT = 09:00 UTC
23:00 BRT = 02:00 UTC (dia seguinte)
```

## 📞 Links Úteis

- **Supabase Dashboard**: https://supabase.com/dashboard
- **API-Football**: https://www.api-football.com/
- **RevenueCat**: https://www.revenuecat.com/
- **Expo**: https://expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/

## 🎯 Checklist Diário

### Manhã (após 06:30)
- [ ] Verificar se análises foram geradas
- [ ] Verificar quantidade (deve ser ~8)
- [ ] Verificar tier (2 free, resto premium)
- [ ] Testar no app

### Noite (após 23:30)
- [ ] Verificar se resultados foram atualizados
- [ ] Verificar taxa de acerto
- [ ] Verificar se há erros nos logs

### Semanal
- [ ] Revisar taxa de acerto geral
- [ ] Verificar performance por liga
- [ ] Limpar dados antigos (>30 dias)
- [ ] Verificar uso da API-Football

## 🚨 Alertas

### Quando Investigar
- Taxa de acerto < 60%
- Nenhuma análise gerada
- Erros repetidos nos logs
- API-Football retorna 429 (limite)
- Tempo de resposta > 5 segundos

### Ações Corretivas
1. Verificar logs
2. Testar Edge Functions manualmente
3. Verificar status da API-Football
4. Verificar limites de requisições
5. Ajustar algoritmo se necessário

---

**Última atualização**: 07/05/2026  
**Versão**: 1.0.0
