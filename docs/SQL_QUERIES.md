# Queries SQL Úteis - CornerEdge

Coleção de queries SQL úteis para administração e monitoramento do CornerEdge.

## 📊 Consultas de Monitoramento

### Ver Análises de Hoje
```sql
SELECT 
    id,
    home_team,
    away_team,
    league,
    confidence,
    avg_prediction,
    probable_range_min || '-' || probable_range_max as range,
    tier,
    status,
    TO_CHAR(kickoff_at, 'HH24:MI') as kickoff
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE
ORDER BY kickoff_at;
```

### Estatísticas do Dia
```sql
SELECT 
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE tier = 'free') as free_count,
    COUNT(*) FILTER (WHERE tier = 'premium') as premium_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate_percent
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE;
```

### Taxa de Acerto por Liga
```sql
SELECT 
    league,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE status != 'pending'
GROUP BY league
ORDER BY hit_rate DESC;
```

### Análises Mais Confiantes
```sql
SELECT 
    home_team,
    away_team,
    league,
    confidence,
    avg_prediction,
    status,
    actual_corners
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE
ORDER BY confidence DESC
LIMIT 10;
```

## 📈 Análises Históricas

### Performance dos Últimos 7 Dias
```sql
SELECT 
    DATE(published_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE published_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(published_at)
ORDER BY date DESC;
```

### Performance por Faixa de Confiança
```sql
SELECT 
    CASE 
        WHEN confidence >= 90 THEN '90-95%'
        WHEN confidence >= 85 THEN '85-89%'
        WHEN confidence >= 80 THEN '80-84%'
        ELSE '75-79%'
    END as confidence_range,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE status != 'pending'
GROUP BY confidence_range
ORDER BY confidence_range DESC;
```

### Top 10 Times Mais Analisados
```sql
SELECT 
    team,
    COUNT(*) as times_analyzed,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM (
    SELECT home_team as team, status FROM corner_analyses
    UNION ALL
    SELECT away_team as team, status FROM corner_analyses
) teams
GROUP BY team
ORDER BY times_analyzed DESC
LIMIT 10;
```

## 🔍 Análises Detalhadas

### Ver Análise Completa com Todas as Relações
```sql
SELECT 
    ca.*,
    json_agg(DISTINCT rs.*) FILTER (WHERE rs.id IS NOT NULL) as robust_scenarios,
    json_agg(DISTINCT sd.*) FILTER (WHERE sd.id IS NOT NULL) as distribution,
    json_agg(DISTINCT ts.*) FILTER (WHERE ts.id IS NOT NULL) as team_stats
FROM corner_analyses ca
LEFT JOIN robust_scenarios rs ON rs.analysis_id = ca.id
LEFT JOIN statistical_distribution sd ON sd.analysis_id = ca.id
LEFT JOIN team_statistics ts ON ts.analysis_id = ca.id
WHERE ca.id = 'ID_DA_ANALISE'
GROUP BY ca.id;
```

### Análises com Maior Desvio
```sql
SELECT 
    home_team,
    away_team,
    avg_prediction,
    actual_corners,
    ABS(avg_prediction - actual_corners) as deviation,
    status
FROM corner_analyses
WHERE actual_corners IS NOT NULL
ORDER BY deviation DESC
LIMIT 20;
```

### Cenários Robustos Mais Acertados
```sql
SELECT 
    rs.threshold,
    rs.stability,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE ca.actual_corners >= rs.threshold) as hit,
    ROUND(
        COUNT(*) FILTER (WHERE ca.actual_corners >= rs.threshold)::numeric / 
        COUNT(*) * 100, 
        2
    ) as hit_rate
FROM robust_scenarios rs
JOIN corner_analyses ca ON ca.id = rs.analysis_id
WHERE ca.actual_corners IS NOT NULL
GROUP BY rs.threshold, rs.stability
ORDER BY rs.threshold, rs.stability;
```

## 🧹 Manutenção

### Limpar Análises Antigas (>30 dias)
```sql
-- CUIDADO: Esta query deleta dados permanentemente!
-- Execute apenas se tiver certeza

DELETE FROM corner_analyses
WHERE published_at < CURRENT_DATE - INTERVAL '30 days';
```

### Limpar Análises Pendentes Antigas (>7 dias)
```sql
-- Remove análises pendentes que nunca foram atualizadas
DELETE FROM corner_analyses
WHERE status = 'pending'
AND published_at < CURRENT_DATE - INTERVAL '7 days';
```

### Reprocessar Status de Análise Específica
```sql
-- Atualizar status manualmente se necessário
UPDATE corner_analyses
SET 
    status = CASE 
        WHEN actual_corners >= probable_range_min 
         AND actual_corners <= probable_range_max 
        THEN 'correct'
        ELSE 'incorrect'
    END,
    updated_at = NOW()
WHERE id = 'ID_DA_ANALISE'
AND actual_corners IS NOT NULL;
```

## 📊 Relatórios

### Relatório Mensal Completo
```sql
SELECT 
    TO_CHAR(published_at, 'YYYY-MM') as month,
    COUNT(*) as total_analyses,
    COUNT(DISTINCT league) as leagues_covered,
    COUNT(*) FILTER (WHERE tier = 'free') as free_analyses,
    COUNT(*) FILTER (WHERE tier = 'premium') as premium_analyses,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(AVG(confidence), 2) as avg_confidence,
    ROUND(AVG(avg_prediction), 2) as avg_prediction,
    ROUND(AVG(actual_corners) FILTER (WHERE actual_corners IS NOT NULL), 2) as avg_actual,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
GROUP BY TO_CHAR(published_at, 'YYYY-MM')
ORDER BY month DESC;
```

### Análise de Distribuição de Previsões
```sql
SELECT 
    CASE 
        WHEN avg_prediction < 8 THEN '< 8'
        WHEN avg_prediction < 9 THEN '8-9'
        WHEN avg_prediction < 10 THEN '9-10'
        WHEN avg_prediction < 11 THEN '10-11'
        WHEN avg_prediction < 12 THEN '11-12'
        ELSE '>= 12'
    END as prediction_range,
    COUNT(*) as count,
    ROUND(AVG(confidence), 2) as avg_confidence,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
GROUP BY prediction_range
ORDER BY prediction_range;
```

## 🔧 Utilitários

### Verificar Integridade dos Dados
```sql
-- Análises sem cenários robustos
SELECT ca.id, ca.home_team, ca.away_team
FROM corner_analyses ca
LEFT JOIN robust_scenarios rs ON rs.analysis_id = ca.id
WHERE rs.id IS NULL;

-- Análises sem distribuição
SELECT ca.id, ca.home_team, ca.away_team
FROM corner_analyses ca
LEFT JOIN statistical_distribution sd ON sd.analysis_id = ca.id
WHERE sd.id IS NULL;

-- Análises sem estatísticas de times
SELECT ca.id, ca.home_team, ca.away_team
FROM corner_analyses ca
LEFT JOIN team_statistics ts ON ts.analysis_id = ca.id
WHERE ts.id IS NULL;
```

### Estatísticas de Uso do Banco
```sql
-- Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Contagem de registros
SELECT 
    'corner_analyses' as table_name, 
    COUNT(*) as count 
FROM corner_analyses
UNION ALL
SELECT 
    'robust_scenarios', 
    COUNT(*) 
FROM robust_scenarios
UNION ALL
SELECT 
    'statistical_distribution', 
    COUNT(*) 
FROM statistical_distribution
UNION ALL
SELECT 
    'team_statistics', 
    COUNT(*) 
FROM team_statistics;
```

## 🎯 Queries para Debugging

### Ver Últimas Análises Criadas
```sql
SELECT 
    id,
    home_team,
    away_team,
    confidence,
    tier,
    status,
    created_at
FROM corner_analyses
ORDER BY created_at DESC
LIMIT 10;
```

### Ver Análises com Fixture ID
```sql
SELECT 
    fixture_id,
    home_team,
    away_team,
    status,
    actual_corners
FROM corner_analyses
WHERE fixture_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;
```

### Verificar Cron Jobs (se usando pg_cron)
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

**Dica**: Salve suas queries favoritas como views para acesso rápido:

```sql
CREATE VIEW v_today_stats AS
SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE;

-- Uso: SELECT * FROM v_today_stats;
```
