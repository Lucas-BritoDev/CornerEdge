# 🔍 DIAGNÓSTICO: Picks de Amanhã não Aparecem Hoje

**Data:** 06/05/2026 - 17:50 UTC (14:50 BRT)  
**Status:** 🔴 CRÍTICO

---

## 📋 PROBLEMAS IDENTIFICADOS

### **1. Jogos que já passaram ainda aparecem como pending**

**Situação:**
- 9 jogos começaram entre 15:00 e 17:30 UTC (já passaram 0.3 a 2.8 horas)
- Todos ainda mostram `status = 'pending'` no banco
- Aparecem nas múltiplas de hoje como se fossem jogar

**Causa Raiz:**
- API-Football está com dados desatualizados
- Jogo `Basake Holy Stars vs Aduana Stars` (ID: 1468743) mostra status "NS" (Not Started) mesmo tendo começado há 3 horas
- Ligas menores (Ghana Premier League) não têm cobertura em tempo real
- Função `update-results` só atualiza jogos com status "FT", "AET" ou "PEN"

**Impacto:**
- Usuários veem jogos que já passaram como se fossem jogar
- Múltiplas ficam "travadas" em pending
- Experiência ruim do usuário

---

### **2. Jogos de amanhã não viram múltiplas de hoje**

**Situação:**
- Página "Amanhã" mostra jogos do dia 07/05 (como PSG x Bayern)
- Esses jogos NÃO aparecem nas múltiplas de hoje (06/05)
- Usuário esperava que jogos de amanhã fossem analisados hoje

**Causa Raiz:**
- Cron job `generate-daily-picks` roda às **06:00 UTC** (03:00 BRT)
- Ele gera picks para **"hoje"** (o dia em que roda)
- Quando roda às 06:00 do dia 06/05 → gera picks para 06/05
- Quando rodar às 06:00 do dia 07/05 → vai gerar picks para 07/05
- **Não há geração antecipada de picks**

**Lógica Atual:**
```
06/05 06:00 UTC → Gera picks para 06/05
07/05 06:00 UTC → Gera picks para 07/05
```

**Lógica Esperada pelo Usuário:**
```
06/05 06:00 UTC → Gera picks para 06/05 E 07/05
07/05 06:00 UTC → Gera picks para 07/05 E 08/05
```

**Impacto:**
- Usuários não veem análises de jogos de amanhã
- Perdem oportunidade de planejar apostas com antecedência
- Página "Amanhã" vira apenas "preview" sem análise

---

## 🎯 SOLUÇÕES PROPOSTAS

### **Solução 1: Gerar Picks com 1 Dia de Antecedência** ⭐ RECOMENDADA

**Mudança:**
- Modificar `generate-daily-picks` para gerar picks para **amanhã** ao invés de hoje
- Cron job roda às 06:00 do dia 06/05 → gera picks para 07/05
- Usuários veem análises com 1 dia de antecedência

**Vantagens:**
- ✅ Usuários planejam apostas com antecedência
- ✅ Mais tempo para análise e decisão
- ✅ Alinhado com expectativa do usuário
- ✅ Simples de implementar (mudar 1 linha de código)

**Desvantagens:**
- ⚠️ Odds podem mudar entre geração e kickoff
- ⚠️ Lesões de última hora não são consideradas

**Implementação:**
```typescript
// ANTES:
const today = new Date().toISOString().split("T")[0];

// DEPOIS:
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const targetDate = tomorrow.toISOString().split("T")[0];
```

---

### **Solução 2: Gerar Picks para Hoje E Amanhã**

**Mudança:**
- Modificar `generate-daily-picks` para gerar 2 lotes:
  - Picks para hoje (jogos que começam hoje)
  - Picks para amanhã (jogos que começam amanhã)

**Vantagens:**
- ✅ Cobre ambos os dias
- ✅ Flexibilidade máxima

**Desvantagens:**
- ⚠️ Dobra o número de chamadas à API-Football
- ⚠️ Pode ultrapassar limite de 100 calls/dia
- ⚠️ Mais complexo de implementar

---

### **Solução 3: Atualizar Picks Durante o Dia**

**Mudança:**
- Cron job às 06:00 gera picks para hoje
- Cron job às 18:00 gera picks para amanhã (se não existirem)

**Vantagens:**
- ✅ Picks de hoje têm odds mais atualizadas
- ✅ Picks de amanhã aparecem à tarde

**Desvantagens:**
- ⚠️ Usuários não veem picks de amanhã pela manhã
- ⚠️ Requer 2 cron jobs

---

## 🔧 SOLUÇÃO PARA PROBLEMA 1: Jogos Desatualizados

### **Opção A: Timeout Automático** ⭐ RECOMENDADA

**Mudança:**
- Se jogo passou do kickoff + 2 horas E ainda está pending
- Marcar automaticamente como "void" (anulado)
- Não conta como vitória nem derrota

**Implementação:**
```typescript
// Em update-results
if (fixture.status === "NS" && kickoffTime + 2h < now) {
  status = "void";
  reason = "Jogo não atualizado pela API";
}
```

**Vantagens:**
- ✅ Múltiplas não ficam travadas
- ✅ Usuário sabe que jogo foi anulado
- ✅ Não penaliza por problema da API

---

### **Opção B: Filtrar Ligas Menores**

**Mudança:**
- Remover ligas com cobertura ruim da lista `LEAGUE_IDS`
- Focar em ligas principais (Premier League, La Liga, etc.)

**Vantagens:**
- ✅ Evita jogos sem cobertura
- ✅ Melhora qualidade dos picks

**Desvantagens:**
- ⚠️ Menos jogos disponíveis
- ⚠️ Pode limitar variedade

---

## 📊 DADOS DO PROBLEMA

### Cron Jobs Ativos
```sql
jobname: generate-daily-picks
schedule: 0 6 * * * (06:00 UTC diariamente)
active: true

jobname: update-results-frequent  
schedule: */5 * * * * (a cada 5 minutos)
active: true
```

### Picks de Hoje (06/05/2026)
```
Total: 4 múltiplas
- 2 free (4 seleções cada)
- 2 premium (2-4 seleções cada)

Jogos que já passaram: 9
Jogos pending: 13
```

### Fixtures de Amanhã (07/05/2026)
```
No cache: 0 fixtures
Motivo: Cron job ainda não rodou para gerar picks de amanhã
```

---

## ✅ RECOMENDAÇÃO FINAL

**Implementar Solução 1 + Opção A:**

1. **Gerar picks com 1 dia de antecedência**
   - Modificar `generate-daily-picks` para gerar picks para amanhã
   - Usuários veem análises com antecedência

2. **Timeout automático para jogos desatualizados**
   - Modificar `update-results` para marcar como "void" jogos que passaram + 2h sem atualização
   - Evita múltiplas travadas

**Próximos Passos:**
1. ✅ Modificar `generate-daily-picks/index.ts`
2. ✅ Modificar `update-results/index.ts`
3. ✅ Testar localmente
4. ✅ Deploy das funções
5. ✅ Executar manualmente para gerar picks de amanhã
6. ✅ Monitorar por 24h

---

**Tempo Estimado:** 30 minutos  
**Risco:** Baixo  
**Impacto:** Alto (melhora experiência do usuário)
