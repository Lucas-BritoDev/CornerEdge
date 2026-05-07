# Próximos Passos - CornerEdge

Guia detalhado do que fazer agora para colocar o CornerEdge em produção.

## 🎯 Objetivo

Configurar os cron jobs para automação completa e testar o fluxo end-to-end.

## ⏱️ Tempo Estimado

- **Configuração**: 15-20 minutos
- **Testes**: 30-45 minutos
- **Total**: ~1 hora

---

## Passo 1: Testar Edge Functions Manualmente

Antes de configurar os cron jobs, vamos garantir que as Edge Functions funcionam.

### 1.1. Abrir Terminal

**Windows (PowerShell):**
```powershell
cd C:\caminho\para\corneredge
.\scripts\test-edge-functions.ps1 generate
```

**Linux/Mac (Bash):**
```bash
cd /caminho/para/corneredge
chmod +x scripts/test-edge-functions.sh
./scripts/test-edge-functions.sh generate
```

### 1.2. Verificar Resposta

Você deve ver algo como:
```json
{
  "success": true,
  "count": 8,
  "message": "Generated 8 corner analyses"
}
```

Se receber erro:
- ❌ **401 Unauthorized**: Verifique `EXPO_PUBLIC_SUPABASE_ANON_KEY` no `.env`
- ❌ **404 Not Found**: Verifique se as Edge Functions foram deployadas
- ❌ **500 Internal Error**: Verifique logs no Supabase Dashboard

### 1.3. Verificar Dados no Banco

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto "corner"
3. Vá em **Table Editor** → `corner_analyses`
4. Você deve ver as análises geradas

✅ **Checkpoint**: Se você vê análises no banco, pode prosseguir!

---

## Passo 2: Testar no Aplicativo

### 2.1. Iniciar o App

```bash
npm start
```

Escolha a plataforma (Android/iOS/Web)

### 2.2. Verificar Tela Home

- [ ] App abre sem erros
- [ ] Tela Home carrega
- [ ] Você vê as análises geradas
- [ ] Cards mostram informações corretas
- [ ] Modal abre ao tocar no card

### 2.3. Testar Funcionalidades

**FREE:**
- [ ] Primeiros 2 cards são acessíveis
- [ ] Cards premium mostram bloqueio
- [ ] Anúncio recompensado funciona (se configurado)

**Navegação:**
- [ ] Pull to refresh funciona
- [ ] Tela de Resultados abre
- [ ] Tela de Premium abre
- [ ] Tela de Perfil abre

✅ **Checkpoint**: Se tudo funciona, pode configurar automação!

---

## Passo 3: Configurar Variáveis de Ambiente das Edge Functions

### 3.1. Acessar Supabase Dashboard

1. Vá em **Edge Functions** → **Settings**
2. Clique em **Add secret**

### 3.2. Adicionar Variável

**Nome**: `FOOTBALL_API_KEY`  
**Valor**: `1a896aad078a4eec7ab7121281bcd5ec`

Clique em **Save**

✅ **Checkpoint**: Variável configurada!

---

## Passo 4: Configurar Cron Jobs

### Opção A: Usando pg_cron (Recomendado)

#### 4.1. Habilitar Extensão

1. No Supabase Dashboard, vá em **Database** → **Extensions**
2. Procure por `pg_cron`
3. Clique em **Enable**

#### 4.2. Habilitar Extensão http

1. Ainda em **Extensions**
2. Procure por `http` (ou `pg_net`)
3. Clique em **Enable**

#### 4.3. Criar Funções SQL

1. Vá em **SQL Editor**
2. Clique em **New query**
3. Cole o seguinte SQL:

```sql
-- ============================================
-- CONFIGURAÇÃO DE CRON JOBS - CORNEREDGE
-- ============================================

-- 1. Criar função para chamar generate-daily-analyses
CREATE OR REPLACE FUNCTION call_generate_analyses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
  project_url text := 'https://seu-projeto.supabase.co';
  response_status int;
  response_body text;
BEGIN
  -- Chamar a Edge Function
  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    project_url || '/functions/v1/generate-daily-analyses',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_role_key)
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log do resultado
  RAISE NOTICE 'Generate Analyses - Status: %, Body: %', response_status, response_body;
END;
$$;

-- 2. Criar função para chamar update-results
CREATE OR REPLACE FUNCTION call_update_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
  project_url text := 'https://seu-projeto.supabase.co';
  response_status int;
  response_body text;
BEGIN
  SELECT status, content INTO response_status, response_body
  FROM http((
    'POST',
    project_url || '/functions/v1/update-results',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('Authorization', 'Bearer ' || service_role_key)
    ],
    'application/json',
    '{}'
  )::http_request);
  
  RAISE NOTICE 'Update Results - Status: %, Body: %', response_status, response_body;
END;
$$;

-- 3. Agendar geração diária às 06:00 BRT (09:00 UTC)
SELECT cron.schedule(
  'generate-daily-analyses',
  '0 9 * * *',
  'SELECT call_generate_analyses();'
);

-- 4. Agendar atualização de resultados às 23:00 BRT (02:00 UTC do dia seguinte)
SELECT cron.schedule(
  'update-daily-results',
  '0 2 * * *',
  'SELECT call_update_results();'
);

-- 5. Verificar jobs criados
SELECT * FROM cron.job;
```

#### 4.4. Substituir Valores

**IMPORTANTE**: Antes de executar, substitua:

1. `SUA_SERVICE_ROLE_KEY_AQUI` → Sua service role key (encontre em **Settings** → **API**)
2. `https://seu-projeto.supabase.co` → Sua URL do Supabase

#### 4.5. Executar SQL

Clique em **Run** ou pressione `Ctrl+Enter`

#### 4.6. Verificar Criação

Execute:
```sql
SELECT * FROM cron.job;
```

Você deve ver 2 jobs:
- `generate-daily-analyses` - `0 9 * * *`
- `update-daily-results` - `0 2 * * *`

✅ **Checkpoint**: Cron jobs configurados!

### Opção B: Usando Serviço Externo

Se preferir usar um serviço como **Cron-job.org**:

1. Crie conta em [cron-job.org](https://cron-job.org)
2. Crie 2 jobs:

**Job 1 - Gerar Análises:**
- URL: `https://seu-projeto.supabase.co/functions/v1/generate-daily-analyses`
- Método: POST
- Horário: `0 9 * * *` (09:00 UTC = 06:00 BRT)
- Headers:
  ```
  Authorization: Bearer sua-anon-key
  Content-Type: application/json
  ```

**Job 2 - Atualizar Resultados:**
- URL: `https://seu-projeto.supabase.co/functions/v1/update-results`
- Método: POST
- Horário: `0 2 * * *` (02:00 UTC = 23:00 BRT anterior)
- Headers: (mesmos do Job 1)

---

## Passo 5: Testar Cron Jobs

### 5.1. Testar Manualmente

Execute no SQL Editor:
```sql
SELECT call_generate_analyses();
```

Aguarde ~2-3 minutos e verifique:
```sql
SELECT COUNT(*) FROM corner_analyses WHERE DATE(published_at) = CURRENT_DATE;
```

### 5.2. Ver Logs de Execução

```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### 5.3. Verificar Edge Function Logs

1. Vá em **Edge Functions** → **Logs**
2. Filtre por `generate-daily-analyses`
3. Verifique se há erros

✅ **Checkpoint**: Cron jobs funcionando!

---

## Passo 6: Monitoramento

### 6.1. Criar Query de Monitoramento

Salve esta query no SQL Editor:

```sql
-- Dashboard de Monitoramento CornerEdge
SELECT 
    'Hoje' as periodo,
    COUNT(*) as total_analyses,
    COUNT(*) FILTER (WHERE tier = 'free') as free,
    COUNT(*) FILTER (WHERE tier = 'premium') as premium,
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'correct') as correct,
    COUNT(*) FILTER (WHERE status = 'incorrect') as incorrect,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'correct')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status != 'pending'), 0) * 100, 
        2
    ) as hit_rate
FROM corner_analyses
WHERE DATE(published_at) = CURRENT_DATE;
```

### 6.2. Verificar Diariamente

Execute esta query todo dia para monitorar:
- Quantas análises foram geradas
- Quantas foram atualizadas
- Qual a taxa de acerto

---

## Passo 7: Ajustes Finais

### 7.1. Ajustar Horários (se necessário)

Se quiser mudar os horários:

```sql
-- Remover job existente
SELECT cron.unschedule('generate-daily-analyses');

-- Criar com novo horário (exemplo: 07:00 BRT = 10:00 UTC)
SELECT cron.schedule(
  'generate-daily-analyses',
  '0 10 * * *',
  'SELECT call_generate_analyses();'
);
```

### 7.2. Configurar Notificações (Opcional)

Para receber notificações de erros, você pode:
1. Criar uma Edge Function de notificação
2. Chamar via webhook quando houver erro
3. Integrar com Slack/Discord/Email

---

## ✅ Checklist Final

Antes de considerar pronto para produção:

### Configuração
- [ ] Edge Functions deployadas
- [ ] Variáveis de ambiente configuradas
- [ ] Cron jobs agendados
- [ ] Testes manuais passando

### Funcionalidades
- [ ] Geração de análises funciona
- [ ] Atualização de resultados funciona
- [ ] App mostra dados corretamente
- [ ] Sistema FREE/PREMIUM funciona
- [ ] Anúncios funcionam (se configurado)

### Monitoramento
- [ ] Logs acessíveis
- [ ] Query de monitoramento salva
- [ ] Processo de verificação diária definido

### Documentação
- [ ] README.md lido
- [ ] QUICK_START.md seguido
- [ ] CRON_SETUP.md consultado
- [ ] SQL_QUERIES.md marcado

---

## 🚀 Pronto para Produção!

Se todos os checkboxes acima estão marcados, você está pronto para:

1. **Build de Produção**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

2. **Submit para Stores**
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

3. **Monitorar Primeira Execução**
   - Amanhã às 06:00 BRT, verifique se análises foram geradas
   - Amanhã às 23:00 BRT, verifique se resultados foram atualizados

---

## 🆘 Problemas Comuns

### Cron não executa
- Verifique se `pg_cron` está habilitado
- Verifique se as funções SQL foram criadas
- Verifique logs: `SELECT * FROM cron.job_run_details`

### Edge Function retorna erro
- Verifique variáveis de ambiente
- Verifique logs no Dashboard
- Teste manualmente via script

### Nenhum jogo encontrado
- Normal se não houver jogos das ligas principais hoje
- Teste com data que você sabe que tem jogos
- Verifique limite da API-Football

---

## 📞 Suporte

Se precisar de ajuda:
1. Consulte [SQL_QUERIES.md](./SQL_QUERIES.md) para debugging
2. Verifique logs no Supabase Dashboard
3. Execute scripts de teste
4. Revise [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

**Boa sorte com o lançamento! 🎉⚽**
