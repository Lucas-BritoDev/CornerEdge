# Configuração de Cron Jobs - CornerEdge

Este documento explica como configurar os cron jobs para geração automática de análises e atualização de resultados.

## Edge Functions Criadas

### 1. `generate-daily-analyses`
Gera as análises diárias de escanteios baseadas nos jogos do dia.

**URL**: `https://[seu-projeto].supabase.co/functions/v1/generate-daily-analyses`

**Método**: POST

**Quando executar**: Diariamente às 06:00 BRT (antes dos jogos começarem)

### 2. `update-results`
Atualiza os resultados das análises com os escanteios reais após os jogos terminarem.

**URL**: `https://[seu-projeto].supabase.co/functions/v1/update-results`

**Método**: POST

**Quando executar**: Diariamente às 23:00 BRT (após a maioria dos jogos terminarem)

## Configuração no Supabase Dashboard

### Opção 1: Usando Supabase Cron (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá em **Database** → **Extensions**
3. Habilite a extensão `pg_cron`
4. Vá em **SQL Editor** e execute:

```sql
-- Criar função para chamar a Edge Function de geração
CREATE OR REPLACE FUNCTION call_generate_analyses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
  project_url text;
BEGIN
  -- Buscar as variáveis de ambiente
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';
  
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  -- Chamar a Edge Function
  PERFORM
    net.http_post(
      url := project_url || '/functions/v1/generate-daily-analyses',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Criar função para chamar a Edge Function de atualização
CREATE OR REPLACE FUNCTION call_update_results()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text;
  project_url text;
BEGIN
  SELECT decrypted_secret INTO service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';
  
  SELECT decrypted_secret INTO project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  PERFORM
    net.http_post(
      url := project_url || '/functions/v1/update-results',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := '{}'::jsonb
    );
END;
$$;

-- Agendar geração diária às 06:00 BRT (09:00 UTC)
SELECT cron.schedule(
  'generate-daily-analyses',
  '0 9 * * *',
  'SELECT call_generate_analyses();'
);

-- Agendar atualização de resultados às 23:00 BRT (02:00 UTC do dia seguinte)
SELECT cron.schedule(
  'update-daily-results',
  '0 2 * * *',
  'SELECT call_update_results();'
);
```

### Opção 2: Usando Serviço Externo (Alternativa)

Se preferir usar um serviço externo como **Cron-job.org** ou **EasyCron**:

1. Crie uma conta no serviço de cron
2. Configure dois jobs:

**Job 1 - Gerar Análises**
- URL: `https://[seu-projeto].supabase.co/functions/v1/generate-daily-analyses`
- Método: POST
- Horário: 06:00 BRT (09:00 UTC)
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer [seu-anon-key]
  ```

**Job 2 - Atualizar Resultados**
- URL: `https://[seu-projeto].supabase.co/functions/v1/update-results`
- Método: POST
- Horário: 23:00 BRT (02:00 UTC)
- Headers:
  ```
  Content-Type: application/json
  Authorization: Bearer [seu-anon-key]
  ```

## Variáveis de Ambiente

As Edge Functions precisam das seguintes variáveis de ambiente configuradas no Supabase:

1. Acesse **Edge Functions** → **Settings**
2. Adicione as variáveis:

```
FOOTBALL_API_KEY=1a896aad078a4eec7ab7121281bcd5ec
SUPABASE_URL=[auto-configurado]
SUPABASE_SERVICE_ROLE_KEY=[auto-configurado]
```

## Testando Manualmente

Você pode testar as Edge Functions manualmente usando curl:

```bash
# Testar geração de análises
curl -X POST \
  https://[seu-projeto].supabase.co/functions/v1/generate-daily-analyses \
  -H "Authorization: Bearer [seu-anon-key]" \
  -H "Content-Type: application/json"

# Testar atualização de resultados
curl -X POST \
  https://[seu-projeto].supabase.co/functions/v1/update-results \
  -H "Authorization: Bearer [seu-anon-key]" \
  -H "Content-Type: application/json"
```

## Monitoramento

Para monitorar a execução dos cron jobs:

1. Acesse **Edge Functions** → **Logs**
2. Filtre por função (`generate-daily-analyses` ou `update-results`)
3. Verifique os logs de execução

## Ajustando Horários

Para ajustar os horários de execução:

```sql
-- Listar cron jobs ativos
SELECT * FROM cron.job;

-- Remover um job
SELECT cron.unschedule('generate-daily-analyses');

-- Criar novamente com novo horário
SELECT cron.schedule(
  'generate-daily-analyses',
  '0 10 * * *',  -- Novo horário: 10:00 UTC = 07:00 BRT
  'SELECT call_generate_analyses();'
);
```

## Troubleshooting

### Problema: Edge Function não está sendo executada

**Solução**: Verifique se as variáveis de ambiente estão configuradas corretamente.

### Problema: API retorna erro 429 (Too Many Requests)

**Solução**: A API-Football tem limite de requisições. Considere:
- Reduzir o número de jogos analisados (atualmente 8)
- Adicionar delays entre requisições
- Verificar seu plano da API

### Problema: Análises não aparecem no app

**Solução**: 
1. Verifique os logs da Edge Function
2. Confirme que há jogos agendados para hoje
3. Verifique se os jogos são de ligas principais

## Próximos Passos

1. ✅ Edge Functions criadas
2. ⏳ Configurar cron jobs no Supabase
3. ⏳ Testar execução manual
4. ⏳ Monitorar primeira execução automática
5. ⏳ Ajustar horários conforme necessário
