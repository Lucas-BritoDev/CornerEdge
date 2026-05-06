# ✅ CORREÇÕES IMPLEMENTADAS - Picks de Amanhã

**Data:** 06/05/2026 - 18:00 UTC  
**Status:** 🟡 PARCIALMENTE IMPLEMENTADO (aguardando deploy)

---

## 🔧 MUDANÇAS REALIZADAS

### **1. Função `generate-daily-picks` - Gerar picks com 1 dia de antecedência**

**Arquivo:** `supabase/functions/generate-daily-picks/index.ts`

**Mudança:**
```typescript
// ANTES:
const today = new Date().toISOString().split("T")[0];

// DEPOIS:
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const targetDate = tomorrow.toISOString().split("T")[0];
```

**Impacto:**
- ✅ Cron job às 06:00 do dia 06/05 → gera picks para 07/05
- ✅ Usuários veem análises com 1 dia de antecedência
- ✅ Jogos da página "Amanhã" viram múltiplas de "Hoje"

---

### **2. Função `update-results` - Timeout automático para jogos desatualizados**

**Arquivo:** `supabase/functions/update-results/index.ts`

**Mudança:**
```typescript
function evaluateSelection(sel: any, fixture: any): "won" | "lost" | "void" | "pending" {
  const status = fixture?.fixture?.status?.short;
  
  // ✅ TIMEOUT AUTOMÁTICO: Se jogo passou do kickoff + 2h e ainda está "NS", marcar como void
  if (status === "NS" || !status) {
    const kickoffTime = new Date(sel.kickoff_at).getTime();
    const now = Date.now();
    const hoursSinceKickoff = (now - kickoffTime) / (1000 * 60 * 60);
    
    if (hoursSinceKickoff > 2) {
      console.log(`⚠️ Game ${sel.fixture_id} timeout: ${hoursSinceKickoff.toFixed(1)}h since kickoff, still NS`);
      return "void";
    }
    return "pending";
  }
  
  // ... resto do código
}
```

**Impacto:**
- ✅ Jogos que passaram + 2h sem atualização → marcados como "void"
- ✅ Múltiplas não ficam travadas
- ✅ Usuário sabe que jogo foi anulado por problema da API

---

## 📋 PRÓXIMOS PASSOS

### **Passo 1: Deploy das Funções** 🔴 PENDENTE

**Opção A: Via Supabase Dashboard (RECOMENDADO)**
1. Acessar https://supabase.com/dashboard/project/pgglewzdzqbisidecndz/functions
2. Clicar em "generate-daily-picks" → "Edit"
3. Copiar conteúdo de `supabase/functions/generate-daily-picks/index.ts`
4. Colar e salvar
5. Repetir para "update-results"

**Opção B: Via Supabase CLI**
```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Deploy
supabase functions deploy generate-daily-picks --no-verify-jwt
supabase functions deploy update-results --no-verify-jwt
```

---

### **Passo 2: Executar Manualmente** 🟡 EM ANDAMENTO

**2.1. Atualizar jogos que já passaram:**
```bash
curl -X POST "https://pgglewzdzqbisidecndz.supabase.co/functions/v1/update-results" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w"
```

**Resultado Esperado:**
- 9 jogos marcados como "void" (passaram + 2h sem atualização)
- Múltiplas atualizadas automaticamente

**2.2. Gerar picks de amanhã (07/05):**
```bash
curl -X POST "https://pgglewzdzqbisidecndz.supabase.co/functions/v1/generate-daily-picks?force=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w"
```

**Resultado Esperado:**
- Picks criados para 07/05 (amanhã)
- Jogos como PSG x Bayern aparecem nas múltiplas

---

### **Passo 3: Verificar Resultados** ⏳ AGUARDANDO

**3.1. Verificar picks de amanhã:**
```sql
SELECT 
  dp.pick_date,
  dp.tier,
  COUNT(ps.id) as total_selections
FROM daily_picks dp
LEFT JOIN pick_selections ps ON ps.daily_pick_id = dp.id
WHERE dp.pick_date = '2026-05-07'
GROUP BY dp.id, dp.pick_date, dp.tier;
```

**3.2. Verificar jogos void:**
```sql
SELECT 
  home_team_name,
  away_team_name,
  status,
  kickoff_at
FROM pick_selections
WHERE status = 'void'
  AND DATE(kickoff_at) = '2026-05-06';
```

---

## 📊 IMPACTO ESPERADO

### **Antes:**
- ❌ Jogos de amanhã não aparecem nas múltiplas de hoje
- ❌ Jogos que já passaram ficam travados em "pending"
- ❌ Múltiplas não atualizam

### **Depois:**
- ✅ Jogos de amanhã aparecem nas múltiplas de hoje
- ✅ Jogos desatualizados marcados como "void" automaticamente
- ✅ Múltiplas atualizam corretamente
- ✅ Usuários planejam apostas com antecedência

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Cron Job:** Após deploy, o cron job às 06:00 UTC vai gerar picks para o dia seguinte automaticamente
2. **Timezone:** Cron roda em UTC, não BRT (diferença de 3 horas)
3. **API-Football:** Ligas menores podem ter delay de atualização (por isso o timeout de 2h)
4. **Cache:** Sistema usa cache agressivo para reduzir chamadas à API

---

## 🎯 CHECKLIST DE DEPLOY

- [ ] Deploy de `generate-daily-picks`
- [ ] Deploy de `update-results`
- [ ] Executar `update-results` manualmente
- [ ] Executar `generate-daily-picks?force=true` manualmente
- [ ] Verificar picks de amanhã no banco
- [ ] Verificar jogos void no banco
- [ ] Testar no app (recarregar página "Hoje")
- [ ] Monitorar por 24h

---

**Tempo Estimado Total:** 15 minutos  
**Risco:** Baixo  
**Prioridade:** 🔴 ALTA
