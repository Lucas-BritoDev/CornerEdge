# Quick Start - CornerEdge

Guia rápido para colocar o CornerEdge em funcionamento.

## ✅ Checklist de Configuração

### 1. Pré-requisitos
- [ ] Node.js 18+ instalado
- [ ] Expo CLI instalado (`npm install -g expo-cli`)
- [ ] Conta Supabase criada
- [ ] Chave API-Football obtida

### 2. Configuração do Banco de Dados

#### 2.1. Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves (anon key e service role key)

#### 2.2. Executar Migrations
As migrations já foram aplicadas via Supabase MCP. Verifique se as tabelas existem:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Deve retornar:
-- corner_analyses
-- robust_scenarios
-- statistical_distribution
-- team_statistics
```

### 3. Configuração do Projeto

#### 3.1. Instalar Dependências
```bash
npm install
```

#### 3.2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite `.env` com suas credenciais:
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# API Football
EXPO_PUBLIC_API=1a896aad078a4eec7ab7121281bcd5ec

# RevenueCat (opcional para testes)
EXPO_PUBLIC_REVENUECAT_API_KEY=sua-chave-revenuecat
```

### 4. Configurar Edge Functions

#### 4.1. Verificar Edge Functions
As Edge Functions já foram criadas:
- ✅ `generate-daily-analyses`
- ✅ `update-results`

Verifique no Supabase Dashboard: **Edge Functions**

#### 4.2. Configurar Variáveis de Ambiente das Edge Functions
No Supabase Dashboard:
1. Vá em **Edge Functions** → **Settings**
2. Adicione:
```
FOOTBALL_API_KEY=1a896aad078a4eec7ab7121281bcd5ec
```

### 5. Testar o Sistema

#### 5.1. Testar Edge Functions Manualmente

**Windows (PowerShell):**
```powershell
.\scripts\test-edge-functions.ps1 both
```

**Linux/Mac (Bash):**
```bash
chmod +x scripts/test-edge-functions.sh
./scripts/test-edge-functions.sh both
```

#### 5.2. Executar o App
```bash
npm start
```

Escolha a plataforma:
- `a` - Android
- `i` - iOS
- `w` - Web

### 6. Configurar Cron Jobs

Siga o guia completo em [CRON_SETUP.md](./CRON_SETUP.md)

**Resumo rápido:**
1. Habilite `pg_cron` no Supabase
2. Execute o SQL para criar as funções
3. Agende os jobs:
   - **06:00 BRT**: Gerar análises
   - **23:00 BRT**: Atualizar resultados

### 7. Inserir Dados de Teste (Opcional)

Se quiser testar sem esperar o cron job, você pode gerar análises manualmente:

```bash
# Via PowerShell
.\scripts\test-edge-functions.ps1 generate

# Via Bash
./scripts/test-edge-functions.sh generate
```

Ou via curl:
```bash
curl -X POST \
  https://seu-projeto.supabase.co/functions/v1/generate-daily-analyses \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json"
```

## 🎯 Verificação Final

### Checklist de Funcionamento

- [ ] App abre sem erros
- [ ] Tela de login funciona
- [ ] Tela Home carrega (mesmo vazia)
- [ ] Edge Functions respondem (teste manual)
- [ ] Dados aparecem no banco após gerar análises
- [ ] Dados aparecem no app após refresh

### Comandos Úteis

```bash
# Ver logs do Expo
npm start

# Limpar cache
npm start -- --clear

# Build de desenvolvimento
eas build --profile development --platform android

# Ver logs do Supabase
# Acesse: Dashboard → Edge Functions → Logs
```

## 🐛 Troubleshooting

### Problema: "Network request failed"
**Solução**: Verifique se as URLs no `.env` estão corretas e sem espaços.

### Problema: Edge Function retorna 401
**Solução**: Verifique se a `ANON_KEY` está correta no `.env`.

### Problema: Nenhum jogo encontrado
**Solução**: 
- Verifique se há jogos agendados para hoje nas ligas principais
- Teste com uma data específica que você sabe que tem jogos
- Verifique o limite de requisições da API-Football

### Problema: App não mostra análises
**Solução**:
1. Verifique se as análises foram geradas (Supabase → Table Editor → corner_analyses)
2. Verifique se a data de `published_at` é hoje
3. Force refresh no app (pull to refresh)

## 📚 Próximos Passos

1. ✅ Configuração básica completa
2. ⏭️ Configurar cron jobs para automação
3. ⏭️ Configurar RevenueCat para pagamentos
4. ⏭️ Configurar AdMob para anúncios
5. ⏭️ Testar fluxo completo FREE → PREMIUM
6. ⏭️ Deploy para TestFlight/Google Play (beta)

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Expo: `npm start`
2. Verifique os logs do Supabase: Dashboard → Edge Functions → Logs
3. Verifique a documentação completa: [README.md](../README.md)
4. Consulte o guia de cron: [CRON_SETUP.md](./CRON_SETUP.md)

---

**Tempo estimado de configuração**: 30-45 minutos
