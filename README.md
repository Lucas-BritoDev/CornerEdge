# CornerEdge 🎯⚽

Aplicativo mobile de análise estatística de escanteios para partidas de futebol.

## 📱 Sobre o Projeto

CornerEdge é um aplicativo React Native que fornece análises estatísticas diárias de escanteios para partidas de futebol das principais ligas do mundo. O sistema utiliza algoritmos estatísticos para processar dados históricos e gerar previsões confiáveis.

### Características Principais

- 📊 **Análises Estatísticas**: Previsões baseadas em dados históricos reais
- 🎯 **Alta Confiança**: Algoritmo que considera múltiplos fatores (intensidade, consistência, médias)
- 🆓 **Modelo Freemium**: 2 análises gratuitas por dia, acesso completo para premium
- 🌍 **Ligas Principais**: Premier League, La Liga, Serie A, Bundesliga, Ligue 1 e mais
- 📈 **Distribuição Estatística**: Probabilidades detalhadas para diferentes cenários
- 🏆 **Cenários Robustos**: Identificação de apostas com maior estabilidade

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **API de Dados**: API-Football
- **Autenticação**: Supabase Auth
- **Pagamentos**: RevenueCat
- **Anúncios**: Google AdMob
- **Internacionalização**: i18next

### Estrutura do Banco de Dados

```
corner_analyses (análises principais)
├── robust_scenarios (cenários 7+, 8+, 9+)
├── statistical_distribution (distribuição de probabilidades)
└── team_statistics (estatísticas das equipes)
```

## 🚀 Configuração do Projeto

### Pré-requisitos

- Node.js 18+
- Expo CLI
- Conta Supabase
- Chave API-Football

### Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd corneredge
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:
```
EXPO_PUBLIC_SUPABASE_URL=sua-url-supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
EXPO_PUBLIC_API=sua-chave-api-football
EXPO_PUBLIC_REVENUECAT_API_KEY=sua-chave-revenuecat
```

4. Execute o projeto:
```bash
npm start
```

## 🔄 Sistema de Cron Jobs

O aplicativo utiliza Edge Functions do Supabase para automatizar a geração e atualização de análises:

### 1. Geração Diária (06:00 BRT)
- Busca jogos do dia na API-Football
- Filtra ligas principais
- Analisa últimos 10 jogos de cada time
- Calcula previsões estatísticas
- Publica no banco de dados

### 2. Atualização de Resultados (23:00 BRT)
- Busca resultados dos jogos finalizados
- Compara escanteios reais com previsões
- Atualiza status (correto/incorreto)
- Calcula taxa de acerto

Para configurar os cron jobs, consulte: [docs/CRON_SETUP.md](docs/CRON_SETUP.md)

## 📊 Algoritmo de Análise

O algoritmo considera múltiplos fatores:

### Dados Coletados
- Média de escanteios a favor (últimos 10 jogos)
- Média de escanteios contra (últimos 10 jogos)
- Intensidade em casa (mandante)
- Intensidade fora (visitante)
- Consistência histórica

### Cálculo da Previsão
```
Previsão = ((Média Mandante + Intensidade Casa) / 2 + 
            (Média Visitante + Intensidade Fora) / 2) / 2 + 1
```

### Confiança Estatística
Baseada na consistência dos dados históricos (75-95%)

### Janela Provável
- Previsão alta (>11): ±2 escanteios
- Previsão média (8-11): ±1 escanteio
- Previsão baixa (<8): ±1 escanteio

### Cenários Robustos
Identificação automática de thresholds com maior probabilidade:
- **Muito Estável**: >90% de probabilidade
- **Estável**: 80-90% de probabilidade
- **Moderado**: 65-80% de probabilidade

## 📱 Estrutura de Telas

### Home (Análises de Hoje)
- Lista de análises do dia
- Cards com informações principais
- Modal com análise completa
- Sistema FREE/PREMIUM

### Resultados
- Histórico de análises
- Taxa de acerto
- Navegação por datas
- Status de cada análise

### Premium
- Benefícios do plano
- Comparação FREE vs PREMIUM
- Integração com RevenueCat

### Perfil
- Estatísticas do usuário
- Configurações
- Idioma e tema

## 🌍 Internacionalização

Idiomas suportados:
- 🇧🇷 Português (pt)
- 🇺🇸 Inglês (en)
- 🇪🇸 Espanhol (es)

Arquivos de tradução em: `locales/`

## 🎨 Design System

### Paleta de Cores
- **Primária**: Orange #FF6B00
- **Fundo**: Black #1A1A1A
- **Texto**: White #FFFFFF
- **Cinza**: #666666

### Componentes
- Cards premium com gradientes
- Animações suaves
- Design minimalista
- Foco em legibilidade

## 📦 Serviços

### `football-api-service.ts`
Integração com API-Football para buscar:
- Fixtures do dia
- Estatísticas de jogos
- Histórico de times

### `corner-analysis-algorithm.ts`
Algoritmo principal de análise:
- Processamento de dados
- Cálculo de previsões
- Geração de cenários

### `analyses-service.ts`
Camada de serviço para o banco:
- Queries otimizadas
- React Query hooks
- Cache inteligente

## 🔐 Segurança

- Row Level Security (RLS) habilitado
- Leitura pública, escrita autenticada
- Service role apenas para Edge Functions
- Validação de dados no backend

## 📈 Monitoramento

### Logs
- Edge Functions: Supabase Dashboard
- App: Console logs com prefixos `[Service]`

### Métricas
- Taxa de acerto das análises
- Uso de API (limites)
- Performance das queries

## 🚢 Deploy

### Supabase
1. Criar projeto no Supabase
2. Executar migrations
3. Configurar Edge Functions
4. Configurar cron jobs

### Expo
```bash
# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios

# Submit para stores
eas submit
```

## 📝 Roadmap

- [x] Estrutura base do app
- [x] Integração com API-Football
- [x] Algoritmo de análise
- [x] Edge Functions
- [x] Sistema FREE/PREMIUM
- [ ] Configurar cron jobs
- [ ] Testes automatizados
- [ ] Notificações push
- [ ] Painel administrativo
- [ ] Analytics avançado

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário e confidencial.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através de:
- Email: suporte@corneredge.app
- Website: https://corneredge.app

---

**Última atualização: 12/05/2026**

Desenvolvido com ⚽ por CornerEdge Team
