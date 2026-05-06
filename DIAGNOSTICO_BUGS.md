# 🐛 Diagnóstico de Bugs - GoalEdge

**Data:** 06/05/2026 17:18 UTC  
**Hora Atual:** 14:18 BRT (UTC-3)

---

## 📊 Situação Atual

### Dados no Banco:
- **Hoje:** 2026-05-06
- **Picks hoje:** 4
- **Picks ontem:** 3
- **Primeiro jogo hoje:** 15:00 UTC (12:00 BRT) - **JÁ PASSOU**

### Jogos que já passaram mas estão "pending":
- ✅ 13 jogos já aconteceram mas status = 'pending'
- ✅ Jogos de 05/05 (ontem) ainda pending
- ✅ Jogos de 06/05 (hoje) que já passaram ainda pending

---

## 🔴 PROBLEMA 1: App Fica Carregando Infinitamente

### Causa:
O hook `useTodayPicks()` está funcionando, mas pode estar demorando muito para carregar os dados.

### Diagnóstico:
```typescript
// services/picks-service.ts
export function useTodayPicks() {
  return useQuery({
    queryKey: picksKeys.today(),
    queryFn: fetchTodayPicksBase,
    staleTime: 5 * 60 * 1000,  // 5 minutos
    gcTime: 30 * 60 * 1000,    // 30 minutos
    refetchOnWindowFocus: true, // ❌ PROBLEMA: Refetch toda vez que volta pro app
    retry: 2,
  });
}
```

### Solução:
1. Desabilitar `refetchOnWindowFocus` para evitar loops
2. Adicionar timeout
3. Melhorar tratamento de erro

---

## 🔴 PROBLEMA 2: Botão Sair Não Funciona

### Causa:
O `signOut()` está funcionando, mas pode não estar redirecionando corretamente.

### Diagnóstico:
```typescript
// app/(tabs)/profile.tsx
const handleSignOut = async () => {
    await signOut();
    router.replace('/login'); // ❌ Pode não estar funcionando
};
```

### Solução:
1. Adicionar loading state
2. Verificar se a rota `/login` existe
3. Usar `router.push` em vez de `router.replace`

---

## 🔴 PROBLEMA 3: Jogos Antigos Aparecendo

### Causa:
**Edge Function `update-results` não está rodando!**

Os jogos que já passaram deveriam ter sido atualizados automaticamente, mas estão todos com status `pending`.

### Jogos que deveriam estar finalizados:

#### Ontem (05/05):
- Ethiopia Nigd Bank vs Kedus Giorgis (10:00 UTC) - **7h atrás**
- Qingdao Youth Island vs Tianjin Teda (11:00 UTC) - **6h atrás**
- Yichun Grand Tiger vs Guangzhou Dandelion (11:30 UTC) - **5h30 atrás**
- Shenyang Urban vs Chengdu Better City (11:35 UTC) - **5h25 atrás**
- Şahdağ vs Mingəçevir (12:00 UTC) - **5h atrás**

#### Hoje (06/05):
- Basake Holy Stars vs Aduana Stars (15:00 UTC / 12:00 BRT) - **2h atrás**
- Hawks vs Greater Tomorrow (16:30 UTC / 13:30 BRT) - **48min atrás**

### Solução:
1. Verificar se o cron job `update-results` está configurado
2. Criar Edge Function para atualizar resultados
3. Buscar resultados da API-Football
4. Atualizar status dos picks

---

## 🔴 PROBLEMA 4: Tela Resultados Mostrando Data Errada

### Causa:
A tela de resultados está mostrando "Terça-Feira, 5 De Maio" mas deveria mostrar resultados do **dia anterior** (ontem).

### Diagnóstico:
```typescript
// app/(tabs)/results.tsx
useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
        // Default: ontem ou primeira data disponível
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const initial = availableDates.find(d => d <= yesterday) ?? availableDates[0] ?? yesterday;
        setSelectedDate(initial);
    }
}, [availableDates, selectedDate]);
```

O código está correto, mas:
- **Problema:** Os picks de ontem (05/05) ainda estão `pending`
- **Resultado:** Não há resultados para mostrar

### Solução:
1. Atualizar os resultados dos jogos que já passaram
2. A tela vai funcionar automaticamente depois

---

## 🔧 CORREÇÕES NECESSÁRIAS

### 1. Criar Edge Function `update-results`

```typescript
// supabase/functions/update-results/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Buscar jogos que já passaram e estão pending
  const { data: pendingSelections } = await supabase
    .from('pick_selections')
    .select('*, daily_picks!inner(*)')
    .eq('status', 'pending')
    .lt('kickoff_at', new Date().toISOString());

  if (!pendingSelections || pendingSelections.length === 0) {
    return new Response(JSON.stringify({ message: 'Nenhum jogo para atualizar' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Para cada jogo, buscar resultado na API-Football
  const apiKey = Deno.env.get('APIFOOTBALL_KEY')!;
  
  for (const selection of pendingSelections) {
    if (!selection.fixture_id) continue;

    try {
      // Buscar resultado do jogo
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?id=${selection.fixture_id}`,
        {
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': 'v3.football.api-sports.io',
          },
        }
      );

      const data = await response.json();
      const fixture = data.response?.[0];

      if (!fixture || fixture.fixture.status.short === 'NS') {
        continue; // Jogo ainda não começou
      }

      // 3. Atualizar fixture_cache
      const scoreHome = fixture.goals.home ?? 0;
      const scoreAway = fixture.goals.away ?? 0;
      const status = fixture.fixture.status.short; // FT, AET, PEN, etc.

      await supabase
        .from('fixture_cache')
        .update({
          status,
          score_home: scoreHome,
          score_away: scoreAway,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selection.fixture_id);

      // 4. Determinar se a aposta ganhou ou perdeu
      let selectionStatus = 'lost';
      
      // Lógica de verificação por mercado
      if (selection.market === 'Over 2.5 Goals') {
        selectionStatus = (scoreHome + scoreAway) > 2.5 ? 'won' : 'lost';
      } else if (selection.market === 'Under 2.5 Goals') {
        selectionStatus = (scoreHome + scoreAway) < 2.5 ? 'won' : 'lost';
      } else if (selection.market === 'Over 1.5 Goals') {
        selectionStatus = (scoreHome + scoreAway) > 1.5 ? 'won' : 'lost';
      } else if (selection.market === 'Both Teams to Score') {
        selectionStatus = (scoreHome > 0 && scoreAway > 0) ? 'won' : 'lost';
      }
      // ... adicionar outros mercados

      // 5. Atualizar pick_selection
      await supabase
        .from('pick_selections')
        .update({
          status: selectionStatus,
          score_home: scoreHome,
          score_away: scoreAway,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selection.id);

    } catch (error) {
      console.error(`Erro ao atualizar fixture ${selection.fixture_id}:`, error);
    }
  }

  // 6. Atualizar status dos daily_picks
  const { data: allPicks } = await supabase
    .from('daily_picks')
    .select('*, pick_selections(*)');

  for (const pick of allPicks || []) {
    const selections = pick.pick_selections || [];
    const allFinished = selections.every((s: any) => s.status !== 'pending');

    if (allFinished && selections.length > 0) {
      const allWon = selections.every((s: any) => s.status === 'won');
      const anyLost = selections.some((s: any) => s.status === 'lost');

      let pickStatus = 'pending';
      if (allWon) pickStatus = 'won';
      else if (anyLost) pickStatus = 'lost';

      await supabase
        .from('daily_picks')
        .update({
          status: pickStatus,
          settled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pick.id);
    }
  }

  return new Response(JSON.stringify({ message: 'Resultados atualizados com sucesso' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 2. Configurar Cron Job

```sql
-- Executar a cada 5 minutos
SELECT cron.schedule(
  'update-results-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://pgglewzdzqbisidecndz.supabase.co/functions/v1/update-results',
    headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);
```

### 3. Corrigir Hook useTodayPicks

```typescript
// services/picks-service.ts
export function useTodayPicks() {
  return useQuery({
    queryKey: picksKeys.today(),
    queryFn: fetchTodayPicksBase,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false, // ✅ CORRIGIDO
    retry: 2,
    retryDelay: 1000,
  });
}
```

### 4. Corrigir Botão Sair

```typescript
// app/(tabs)/profile.tsx
const [isSigningOut, setIsSigningOut] = React.useState(false);

const handleSignOut = async () => {
    try {
        setIsSigningOut(true);
        await signOut();
        // Aguardar um pouco para garantir que o signOut completou
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push('/(auth)/login'); // ✅ CORRIGIDO: caminho completo
    } catch (error) {
        console.error('Erro ao sair:', error);
        Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
    } finally {
        setIsSigningOut(false);
    }
};
```

---

## 📋 Checklist de Correções

### Prioridade ALTA (Fazer Agora):
- [ ] Criar Edge Function `update-results`
- [ ] Configurar cron job para rodar a cada 5 minutos
- [ ] Executar manualmente para atualizar jogos passados
- [ ] Corrigir hook `useTodayPicks` (refetchOnWindowFocus)
- [ ] Corrigir botão sair (loading + rota correta)

### Prioridade MÉDIA:
- [ ] Adicionar timeout nos hooks
- [ ] Melhorar tratamento de erro
- [ ] Adicionar logs para debug

### Prioridade BAIXA:
- [ ] Otimizar queries
- [ ] Adicionar cache mais agressivo
- [ ] Melhorar UX de loading

---

## 🎯 Resultado Esperado

Após as correções:

1. ✅ App carrega rapidamente (< 2s)
2. ✅ Botão sair funciona e redireciona para login
3. ✅ Jogos antigos são atualizados automaticamente
4. ✅ Tela de resultados mostra resultados corretos
5. ✅ Status dos picks atualiza em tempo real

---

## 🚀 Próximos Passos

1. Criar Edge Function `update-results`
2. Testar manualmente
3. Configurar cron job
4. Aplicar correções no código do app
5. Testar no dispositivo

---

**Status:** 🔴 Bugs Críticos Identificados  
**Ação:** Implementar correções imediatamente
