# Changelog - CornerEdge

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-05-07

### 🎉 Lançamento Inicial

#### ✨ Adicionado

**Infraestrutura**
- Configuração inicial do projeto React Native + Expo
- Integração com Supabase (autenticação, banco de dados)
- Integração com API-Football para dados reais
- Sistema de internacionalização (pt, en, es)
- Configuração de temas (light/dark)

**Banco de Dados**
- Tabela `corner_analyses` - Análises principais
- Tabela `robust_scenarios` - Cenários robustos (7+, 8+, 9+)
- Tabela `statistical_distribution` - Distribuição de probabilidades
- Tabela `team_statistics` - Estatísticas das equipes
- Row Level Security (RLS) configurado
- Índices de performance criados
- Coluna `fixture_id` para rastreamento de jogos

**Algoritmo de Análise**
- Análise de últimos 10 jogos de cada time
- Cálculo de médias (escanteios a favor/contra)
- Cálculo de intensidade (casa/fora)
- Cálculo de consistência histórica
- Geração de previsão média
- Cálculo de janela provável
- Geração de distribuição estatística (5+ até 12+)
- Identificação de cenários robustos
- Sistema de confiança (75-95%)

**Edge Functions**
- `generate-daily-analyses` - Geração automática de análises
  - Busca jogos do dia
  - Filtra ligas principais (10 ligas)
  - Processa até 8 jogos por dia
  - Atribui tier (2 free, resto premium)
  - Insere no banco com todas as relações
- `update-results` - Atualização de resultados
  - Busca análises pendentes
  - Consulta resultados na API
  - Compara com previsões
  - Atualiza status (correct/incorrect)

**Serviços**
- `football-api-service.ts` - Integração com API-Football
  - Busca de fixtures por data
  - Busca de estatísticas de jogos
  - Busca de últimos jogos de times
  - Extração de dados de escanteios
  - Filtros de ligas e status
- `corner-analysis-algorithm.ts` - Algoritmo principal
  - Análise de times
  - Cálculo de previsões
  - Geração de análises completas
  - Atualização de resultados
- `analyses-service.ts` - Camada de dados
  - Queries otimizadas
  - React Query hooks
  - Cache inteligente (5-10 min)
  - Cálculo de estatísticas

**Telas**
- **Home (Análises de Hoje)**
  - Lista de análises do dia
  - Cards premium com informações principais
  - Modal de análise completa
  - Sistema FREE/PREMIUM
  - Anúncios recompensados para desbloquear
  - Pull to refresh
- **Resultados**
  - Histórico de análises
  - Navegação por datas
  - Estatísticas (hit rate, corretas, incorretas)
  - Cards expansíveis com detalhes
  - Indicador de performance
- **Premium**
  - Comparação FREE vs PREMIUM
  - Preço: $3.00/mês
  - Integração com RevenueCat
  - Lista de benefícios
- **Perfil**
  - Estatísticas do usuário
  - Total de análises
  - Taxa de acerto (7 dias)
  - Configurações
  - Logout

**Componentes**
- Cards de análise premium
- Modal de detalhes
- Barras de probabilidade
- Indicadores de estabilidade
- Loading states
- Empty states

**Traduções**
- Português (pt) - Completo
- Inglês (en) - Completo
- Espanhol (es) - Completo
- Termos específicos de escanteios
- Onboarding traduzido

**Documentação**
- README.md - Documentação principal
- QUICK_START.md - Guia rápido de início
- CRON_SETUP.md - Configuração de cron jobs
- CHANGELOG.md - Histórico de mudanças
- Scripts de teste (PowerShell e Bash)

#### 🔧 Configuração

**Variáveis de Ambiente**
```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API (API-Football)
EXPO_PUBLIC_REVENUECAT_API_KEY
```

**Ligas Suportadas**
- Premier League (Inglaterra)
- La Liga (Espanha)
- Serie A (Itália)
- Bundesliga (Alemanha)
- Ligue 1 (França)
- Primeira Liga (Portugal)
- Eredivisie (Holanda)
- Süper Lig (Turquia)
- Brasileirão (Brasil)
- Liga MX (México)

#### 📊 Métricas

**Performance**
- Cache de queries: 5-10 minutos
- Limite de análises por dia: 8
- Análises gratuitas: 2
- Tempo de geração: ~2-3 minutos
- Tempo de atualização: ~30-60 segundos

**Precisão do Algoritmo**
- Confiança mínima: 75%
- Confiança máxima: 95%
- Baseado em 10 jogos históricos
- Considera múltiplos fatores

### 🎨 Design

**Paleta de Cores**
- Primária: Orange #FF6B00
- Fundo: Black #1A1A1A
- Texto: White #FFFFFF
- Cinza: #666666

**Princípios**
- Design premium e minimalista
- Foco em legibilidade
- Animações suaves
- Cards grandes e informativos
- Sem poluição visual

### 🔐 Segurança

- RLS habilitado em todas as tabelas
- Leitura pública, escrita autenticada
- Service role apenas para Edge Functions
- Validação de dados no backend
- JWT verification nas Edge Functions (desabilitado para cron)

### 📱 Plataformas

- ✅ Android
- ✅ iOS
- ✅ Web (limitado)

### 🚀 Deploy

**Supabase**
- ✅ Banco de dados configurado
- ✅ Edge Functions deployadas
- ⏳ Cron jobs (pendente configuração)

**App**
- ⏳ TestFlight (iOS)
- ⏳ Google Play (Android)

## [Próximas Versões]

### [1.1.0] - Planejado

#### 🎯 Features Planejadas
- [ ] Notificações push (análises publicadas)
- [ ] Histórico completo de análises
- [ ] Filtros avançados (por liga, confiança)
- [ ] Favoritar times/ligas
- [ ] Compartilhamento de análises
- [ ] Dark mode completo
- [ ] Modo offline básico

#### 🔧 Melhorias Planejadas
- [ ] Otimização de queries
- [ ] Cache mais agressivo
- [ ] Animações melhoradas
- [ ] Feedback háptico
- [ ] Skeleton loaders
- [ ] Error boundaries

#### 🐛 Correções Conhecidas
- [ ] Melhorar tratamento de erros da API
- [ ] Adicionar retry logic
- [ ] Melhorar loading states
- [ ] Validação de dados mais robusta

### [1.2.0] - Planejado

#### 🎯 Features Planejadas
- [ ] Painel administrativo web
- [ ] Analytics avançado
- [ ] A/B testing
- [ ] Sistema de feedback
- [ ] Chat de suporte
- [ ] Tutorial interativo

#### 📊 Analytics
- [ ] Mixpanel/Amplitude
- [ ] Tracking de conversão
- [ ] Tracking de retenção
- [ ] Heatmaps

### [2.0.0] - Futuro

#### 🎯 Features Futuras
- [ ] Machine Learning para previsões
- [ ] Análise de múltiplos mercados
- [ ] Sistema de apostas simuladas
- [ ] Ranking de usuários
- [ ] Comunidade/Social
- [ ] API pública

---

## Formato

Este changelog segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- `Adicionado` para novas funcionalidades
- `Modificado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para vulnerabilidades corrigidas
