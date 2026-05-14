# Plano de Implementação: Sistema de Múltiplas no CornerEdge

## Objetivo
Implementar sistema de múltiplas de escanteios similar ao GoalEdge, onde cada pick agrupa 3 jogos em vez de ter 1 pick por jogo.

## Mudanças Necessárias

### 1. Estrutura de Dados
**Atual:** 1 análise = 1 jogo
**Novo:** 1 análise = 3 jogos (múltipla)

#### Opção A: Modificar Tabela Existente (Mais Simples)
```sql
-- Adicionar colunas para múltiplas
ALTER TABLE corner_analyses ADD COLUMN is_multiple BOOLEAN DEFAULT FALSE;
ALTER TABLE corner_analyses ADD COLUMN games JSONB; -- Array de jogos
ALTER TABLE corner_analyses ADD COLUMN combined_confidence INTEGER;

-- Estrutura do JSONB games:
[
  {
    "fixture_id": 12345,
    "home_team": "Team A",
    "away_team": "Team B",
    "league": "Premier League",
    "kickoff_at": "2026-05-13T19:00:00Z",
    "home_logo": "url",
    "away_logo": "url",
    "prediction": 9.5,
    "strategy": "over",
    "confidence": 75
  },
  // ... mais 2 jogos
]
```

#### Opção B: Nova Tabela (Mais Limpo)
```sql
CREATE TABLE corner_multiples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT CHECK (tier IN ('free', 'premium')),
  combined_confidence INTEGER CHECK (combined_confidence >= 0 AND combined_confidence <= 100),
  combined_odd NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect', 'void')),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE corner_multiple_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  multiple_id UUID REFERENCES corner_multiples(id) ON DELETE CASCADE,
  fixture_id INTEGER,
  home_team TEXT,
  away_team TEXT,
  league TEXT,
  kickoff_at TIMESTAMPTZ,
  home_team_logo TEXT,
  away_team_logo TEXT,
  avg_prediction NUMERIC,
  strategy_type TEXT CHECK (strategy_type IN ('over', 'under')),
  confidence INTEGER,
  actual_corners INTEGER,
  result TEXT CHECK (result IN ('pending', 'correct', 'incorrect', 'void'))
);
```

### 2. Lógica de Geração (generate-daily-analyses)

```typescript
// Após gerar todas as análises individuais:
const candidates = predictions
  .filter(p => p.confidence >= 60) // Mínimo para múltiplas
  .sort((a, b) => b.confidence - a.confidence);

// Gerar múltiplas FREE (4 múltiplas de 3 jogos)
const freeMultiples = buildCornerMultiples(candidates, 'free', 4, 3);

// Gerar múltiplas PREMIUM (6 múltiplas de 3 jogos)
const premiumMultiples = buildCornerMultiples(candidates, 'premium', 6, 3);

function buildCornerMultiples(
  candidates: any[],
  tier: 'free' | 'premium',
  numMultiples: number,
  gamesPerMultiple: number
) {
  const multiples = [];
  const used = new Set();
  
  for (let i = 0; i < numMultiples; i++) {
    const games = [];
    let combinedConfidence = 0;
    
    for (const candidate of candidates) {
      if (used.has(candidate.fixture.fixture.id)) continue;
      if (games.length >= gamesPerMultiple) break;
      
      games.push(candidate);
      combinedConfidence += candidate.confidence;
      used.add(candidate.fixture.fixture.id);
    }
    
    if (games.length === gamesPerMultiple) {
      multiples.push({
        games,
        combinedConfidence: Math.round(combinedConfidence / gamesPerMultiple),
        tier
      });
    }
  }
  
  return multiples;
}
```

### 3. Atualização de Resultados (update-results)

```typescript
// Para cada múltipla:
// 1. Verificar resultado de cada jogo
// 2. Se TODOS os jogos ganharam -> múltipla = correct
// 3. Se QUALQUER jogo perdeu -> múltipla = incorrect
// 4. Se algum jogo void -> múltipla = void

for (const multiple of multiples) {
  let allCorrect = true;
  let hasVoid = false;
  
  for (const game of multiple.games) {
    const result = await checkGameResult(game);
    
    if (result === 'void') {
      hasVoid = true;
      break;
    }
    if (result === 'incorrect') {
      allCorrect = false;
      break;
    }
  }
  
  const status = hasVoid ? 'void' : (allCorrect ? 'correct' : 'incorrect');
  await updateMultipleStatus(multiple.id, status);
}
```

### 4. Interface do App

**Componente de Card de Múltipla:**
```tsx
<MultipleCard>
  <Header>
    <Badge>MÚLTIPLA 3X</Badge>
    <Confidence>75%</Confidence>
  </Header>
  
  <GamesList>
    {games.map(game => (
      <GameRow key={game.fixture_id}>
        <Teams>{game.home_team} vs {game.away_team}</Teams>
        <Prediction>{game.strategy} {game.prediction}</Prediction>
      </GameRow>
    ))}
  </GamesList>
  
  <Footer>
    <CombinedOdd>Odd Combinada: 2.5x</CombinedOdd>
  </Footer>
</MultipleCard>
```

## Cronograma de Implementação

1. **Fase 1:** Decidir estrutura de dados (Opção A ou B)
2. **Fase 2:** Modificar edge function generate-daily-analyses
3. **Fase 3:** Modificar edge function update-results
4. **Fase 4:** Criar componente de UI para múltiplas
5. **Fase 5:** Atualizar serviço de análises no app
6. **Fase 6:** Testar e ajustar

## Recomendação

**Usar Opção A (modificar tabela existente)** porque:
- Menos mudanças no código
- Mantém compatibilidade com análises individuais
- Mais rápido de implementar
- Pode coexistir: análises individuais (is_multiple=false) e múltiplas (is_multiple=true)

## Próximos Passos

Você quer que eu implemente isso agora? Posso começar pela Opção A que é mais simples e rápida.
