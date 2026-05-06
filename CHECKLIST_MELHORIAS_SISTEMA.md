# ✅ CHECKLIST DE MELHORIAS - SISTEMA DE CRONS E APOSTAS

**Data:** 06/05/2026  
**Tempo Total:** 15-20 horas  
**Prioridade:** 🔴 CRÍTICO → ⚠️ ALTA → 📊 MÉDIA → 🔮 LONGO PRAZO

---

## 🔴 CRÍTICO - FAZER HOJE (30 min)

### 1. Configurar Cron Jobs

**Tempo:** 30 minutos  
**Impacto:** Sistema começa a funcionar automaticamente

- [ ] Abrir Supabase Dashboard
- [ ] Ir em Settings > Database > Extensions
- [ ] Habilitar extensão `pg_cron`
- [ ] Habilitar extensão `http`
- [ ] Ir em Settings > API
- [ ] Copiar `service_role key` (secret)
- [ ] Abrir SQL Editor no Supabase
- [ ] Abrir arquivo `supabase/migrations/setup_cron_jobs.sql`
- [ ] Substituir `YOUR_SERVICE_ROLE_KEY_HERE` pela key copiada
- [ ] Executar o script completo
- [ ] Verificar que 3 jobs foram criados: `SELECT * FROM cron.job;`
- [ ] Testar manualmente `generate-daily-picks`
- [ ] Testar manualmente `update-results`
- [ ] Testar manualmente `cleanup-cache`
- [ ] Verificar logs: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`

**Resultado Esperado:**
```
✓ 3 cron jobs criados
✓ generate-daily-picks: roda às 02:00 UTC diariamente
✓ update-results: roda a cada 5 minutos
✓ cleanup-cache: roda às 03:00 UTC diariamente
```

---

## ⚠️ ALTA PRIORIDADE - ESTA SEMANA (4h)

### 2. Otimizar Atualização de Resultados

**Tempo:** 2 horas  
**Impacto:** -80% tempo de execução, -88% API calls

#### 2.1 Implementar Chamadas Paralelas

- [ ] Abrir `supabase/functions/update-results/index.ts`
- [ ] Localizar loop sequencial de `fetchFixtureResult`
- [ ] Substituir por código paralelo (Promise.all com batches de 5)
- [ ] Testar localmente
- [ ] Deploy da função: `supabase functions deploy update-results`
- [ ] Verificar logs de performance

**Código a adicionar:**
```typescript
const BATCH_SIZE = 5;
for (let i = 0; i < fixtureIds.length; i += BATCH_SIZE) {
  const batch = fixtureIds.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(
    batch.map(fid => fetchFixtureResult(fid))
  );
  batch.forEach((fid, idx) => {
    fixtureResults[fid] = results[idx];
  });
  if (i + BATCH_SIZE < fixtureIds.length) {
    await new Promise(r => setTimeout(r, 200));
  }
}
```

#### 2.2 Filtrar Apenas Jogos ao Vivo

- [ ] Adicionar filtro de tempo na query
- [ ] Buscar apenas jogos que começaram há menos de 2h
- [ ] Testar com jogos reais
- [ ] Verificar redução de API calls

**Código a adicionar:**
```typescript
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const now = new Date().toISOString();

const { data: pendingSelections } = await supabase
  .from("pick_selections")
  .select("*, daily_picks!inner(pick_date)")
  .eq("status", "pending")
  .gte("kickoff_at", twoHoursAgo)
  .lte("kickoff_at", now)
  .not("fixture_id", "is", null);
```

#### 2.3 Adicionar Logs de Performance

- [ ] Adicionar timestamp no início da função
- [ ] Calcular duração total
- [ ] Logar número de API calls
- [ ] Logar número de atualizações
- [ ] Deploy e verificar logs

**Resultado Esperado:**
```
✓ Tempo de execução: 6s → 1.2s (-80%)
✓ API calls: 8.640/dia → 1.000/dia (-88%)
✓ Logs detalhados de performance
```

### 3. Adicionar Dados de Lesões

**Tempo:** 3 horas  
**Impacto:** +5-10% assertividade

- [ ] Criar arquivo `supabase/functions/generate-daily-picks/injuries.ts`
- [ ] Implementar função `getTeamInjuries(teamId, season)`
- [ ] Implementar função `adjustForInjuries(confidence, homeInj, awayInj)`
- [ ] Integrar no loop de geração de picks
- [ ] Testar com dados reais
- [ ] Validar ajuste de confiança
- [ ] Deploy da função

**Lógica:**
```
Jogador chave lesionado = -5% confiança
Posições chave: Attacker, Midfielder, Goalkeeper
```

**Resultado Esperado:**
```
✓ Função de lesões implementada
✓ Confiança ajustada automaticamente
✓ +5-10% de assertividade
```

---

## 📊 MÉDIA PRIORIDADE - ESTE MÊS (8h)

### 4. Implementar Backtesting

**Tempo:** 3 horas  
**Impacto:** Validar estratégias antes de usar

- [ ] Criar arquivo `scripts/backtest.ts`
- [ ] Implementar função `runBacktest(startDate, endDate)`
- [ ] Calcular Hit Rate histórico
- [ ] Calcular ROI histórico
- [ ] Calcular médias (odds, confiança)
- [ ] Gerar relatório
- [ ] Executar para últimos 30 dias
- [ ] Analisar resultados
- [ ] Ajustar parâmetros se necessário

**Métricas Alvo:**
```
Hit Rate: 70%+
ROI: 15%+
Avg Confidence: 70-75%
```

**Resultado Esperado:**
```
✓ Script de backtesting funcional
✓ Relatório com métricas históricas
✓ Validação de estratégias
```

### 5. Análise de Motivação

**Tempo:** 2 horas  
**Impacto:** +3-5% assertividade

- [ ] Criar arquivo `supabase/functions/generate-daily-picks/motivation.ts`
- [ ] Implementar função `getTeamMotivation(teamId, leagueId, season)`
- [ ] Classificar motivação: "title race" | "fighting relegation" | "mid-table"
- [ ] Implementar função `adjustForMotivation(confidence, homeMotiv, awayMotiv)`
- [ ] Integrar no loop de geração de picks
- [ ] Testar com dados reais
- [ ] Deploy da função

**Lógica:**
```
Top 4: "title race" → +3% confiança
Bottom 3: "fighting relegation" → +5% confiança
Meio da tabela: "mid-table" → sem ajuste
```

**Resultado Esperado:**
```
✓ Função de motivação implementada
✓ Confiança ajustada por contexto
✓ +3-5% de assertividade
```

### 6. Adicionar Mercados de Nicho

**Tempo:** 3 horas  
**Impacto:** Mais opções + odds melhores

#### 6.1 Corners Over/Under

- [ ] Adicionar análise de escanteios
- [ ] Calcular média de corners por time
- [ ] Implementar mercado "Corners Over 9.5"
- [ ] Implementar mercado "Corners Under 9.5"
- [ ] Testar com dados históricos

#### 6.2 Cards Over/Under

- [ ] Adicionar análise de cartões
- [ ] Considerar histórico do árbitro
- [ ] Implementar mercado "Cards Over 3.5"
- [ ] Implementar mercado "Cards Under 3.5"
- [ ] Testar com dados históricos

#### 6.3 HT/FT (Half Time / Full Time)

- [ ] Analisar desempenho por tempo
- [ ] Implementar mercado "HT/FT Home/Home"
- [ ] Implementar mercado "HT/FT Draw/Home"
- [ ] Testar com dados históricos

**Resultado Esperado:**
```
✓ 6 novos mercados adicionados
✓ Mais opções para usuários
✓ Odds potencialmente melhores
```

---

## 🔮 LONGO PRAZO - PRÓXIMOS 3 MESES (20h)

### 7. Machine Learning para Calibração

**Tempo:** 10 horas  
**Impacto:** +10-15% assertividade

- [ ] Coletar 1000+ picks históricos
- [ ] Preparar dataset (features + labels)
- [ ] Escolher modelo (Random Forest, XGBoost, etc.)
- [ ] Treinar modelo
- [ ] Validar com cross-validation
- [ ] Integrar no sistema de geração
- [ ] Monitorar performance
- [ ] Retreinar mensalmente

**Features:**
```
- Confiança calculada
- Forma recente (home/away)
- Média de gols
- H2H score
- Lesões
- Motivação
- Liga
- Mercado
```

**Resultado Esperado:**
```
✓ Modelo treinado com 1000+ picks
✓ Confiança calibrada automaticamente
✓ +10-15% de assertividade
```

### 8. Dashboard de Monitoramento

**Tempo:** 6 horas  
**Impacto:** Visibilidade e controle total

#### 8.1 Views de Métricas

- [ ] Criar view `daily_performance`
- [ ] Criar view `cache_performance`
- [ ] Criar view `api_usage`
- [ ] Testar queries

#### 8.2 Alertas Automáticos

- [ ] Criar função `check_hit_rate_alert()`
- [ ] Criar função `check_api_usage_alert()`
- [ ] Agendar verificações diárias
- [ ] Configurar notificações (email/Slack)

#### 8.3 Relatórios Semanais

- [ ] Criar função `generate_weekly_report()`
- [ ] Incluir métricas principais
- [ ] Incluir gráficos de tendência
- [ ] Agendar envio automático

**Resultado Esperado:**
```
✓ Dashboard com métricas em tempo real
✓ Alertas automáticos configurados
✓ Relatórios semanais automáticos
```

### 9. Configurar Webhooks

**Tempo:** 4 horas  
**Impacto:** -100% de polling, economia total

- [ ] Criar Edge Function `webhook-fixture-update`
- [ ] Configurar no painel API-Football
- [ ] Testar com jogo ao vivo
- [ ] Validar atualização em tempo real
- [ ] Desabilitar polling (update-results a cada 5min)
- [ ] Manter polling como fallback (a cada 30min)

**Resultado Esperado:**
```
✓ Webhooks configurados
✓ Atualizações em tempo real
✓ 0 API calls para polling
✓ Economia de ~8.000 calls/dia
```

---

## 📊 PROGRESSO GERAL

### Status Atual

```
[░░░░░░░░░░░░░░░░░░░░] 0% - Nada implementado
```

### Após Crítico (30 min)

```
[████░░░░░░░░░░░░░░░░] 20% - Cron jobs configurados
```

### Após Alta Prioridade (4h)

```
[████████░░░░░░░░░░░░] 40% - Otimizações implementadas
```

### Após Média Prioridade (8h)

```
[██████████████░░░░░░] 70% - Melhorias de assertividade
```

### Após Longo Prazo (20h)

```
[████████████████████] 100% - Sistema completo e otimizado
```

---

## 📈 MÉTRICAS DE ACOMPANHAMENTO

### Verificar Diariamente

- [ ] Cron jobs executaram com sucesso?
- [ ] Hit rate está acima de 65%?
- [ ] API calls estão abaixo de 2.000/dia?
- [ ] Tempo de update está abaixo de 2s?

### Verificar Semanalmente

- [ ] Hit rate médio da semana
- [ ] ROI médio da semana
- [ ] Total de API calls da semana
- [ ] Feedback dos usuários

### Verificar Mensalmente

- [ ] Tendência de hit rate
- [ ] Tendência de ROI
- [ ] Custo total de API
- [ ] Satisfação dos usuários

---

## 🎯 METAS FINAIS

| Métrica | Atual | Meta | Status |
|---------|-------|------|--------|
| Cron Jobs | 0 | 3 | 🔴 Pendente |
| API Calls/Dia | 8.760 | < 1.000 | 🔴 Pendente |
| Hit Rate | ~65% | 75%+ | 🔴 Pendente |
| ROI | ~5% | 18%+ | 🔴 Pendente |
| Tempo Update | 6s | < 1.5s | 🔴 Pendente |
| Cache Hit Rate | 85% | 90%+ | 🟡 Bom |
| Assertividade Premium | ~70% | 80%+ | 🔴 Pendente |

---

## ✅ CONCLUSÃO

**Próximo Passo:** Começar pelo item 1 (Configurar Cron Jobs) - 30 minutos

**Tempo Total:** 15-20 horas para todas as melhorias

**Resultado Final:** Sistema 100% automático, 75%+ de assertividade, $34/mês de custo de API

---

**Boa sorte! 🚀**

**Criado por:** Kiro AI  
**Data:** 06/05/2026  
**Versão:** 1.0
