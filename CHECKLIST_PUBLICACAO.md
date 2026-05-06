# ✅ Checklist Rápido: Publicar na Play Store

## 📱 ANTES DE COMEÇAR

- [ ] Conta Google Play Console criada ($25 USD)
- [ ] Logo GoalEdge salva como `goaledge-logo.png`
- [ ] Domínio registrado (goaledge.app) ou GitHub Pages configurado

---

## 🎨 ASSETS (30 min)

### Ícones do App
- [ ] `assets/images/icon.png` (1024x1024)
- [ ] `assets/images/adaptive-icon.png` (1024x1024)
- [ ] `assets/images/splash.png` (1284x2778)
- [ ] `assets/images/favicon.png` (48x48)

**Como fazer:**
```bash
# Opção 1: Script automático (se tiver ImageMagick)
.\update-logo.ps1

# Opção 2: Ferramenta online
# https://www.appicon.co/
```

### Assets da Play Store
- [ ] Feature Graphic (1024x500) - Banner horizontal
- [ ] Ícone 512x512 (sem transparência)
- [ ] Screenshots (mínimo 2, máximo 8)
  - [ ] Tela Home
  - [ ] Tela Results
  - [ ] Tela Premium (opcional)
  - [ ] Tela Tomorrow (opcional)

---

## 📝 DOCUMENTAÇÃO (1 hora)

### Política de Privacidade
- [ ] Criar página: `https://goaledge.app/privacy`
- [ ] Incluir:
  - [ ] Dados coletados (email, nome, uso)
  - [ ] Como usa os dados
  - [ ] Compartilhamento (Supabase, AdMob)
  - [ ] Direitos do usuário (LGPD/GDPR)
  - [ ] Contato

### Termos de Serviço
- [ ] Criar página: `https://goaledge.app/terms`
- [ ] Incluir:
  - [ ] Descrição do serviço
  - [ ] Responsabilidades
  - [ ] Limitações
  - [ ] Política de reembolso
  - [ ] Jogo responsável (+18)

**Geradores úteis:**
- https://www.privacypolicygenerator.info/
- https://www.termsofservicegenerator.net/

---

## ⚙️ CONFIGURAÇÃO (30 min)

### app.json
- [ ] `version`: "1.0.0"
- [ ] `versionCode`: 1
- [ ] `package`: "com.goaledge.app"
- [ ] `permissions`: ["INTERNET", "ACCESS_NETWORK_STATE"]
- [ ] Ícones configurados

### Variáveis de Ambiente
- [ ] `.env.production` criado
- [ ] Supabase URL e Key
- [ ] API Football Key
- [ ] AdMob IDs (opcional)

---

## 🔨 BUILD (1 hora)

### Instalar EAS CLI
```bash
npm install -g eas-cli
eas login
```

### Configurar Build
```bash
eas build:configure
```

### Gerar AAB (Android App Bundle)
```bash
eas build --platform android --profile production
```

- [ ] Build iniciado
- [ ] Aguardar 15-20 minutos
- [ ] Download do `.aab`

---

## 🏪 PLAY CONSOLE (2 horas)

### Criar App
- [ ] Nome: GoalEdge
- [ ] Idioma: Português (Brasil)
- [ ] Tipo: App
- [ ] Gratuito com compras no app

### Listagem da Loja
- [ ] Descrição curta (80 caracteres)
- [ ] Descrição completa (até 4000 caracteres)
- [ ] Screenshots (mínimo 2)
- [ ] Feature graphic (1024x500)
- [ ] Ícone (512x512)
- [ ] Categoria: Esportes
- [ ] Tags: futebol, estatísticas, análise

### Política e Termos
- [ ] URL da Política de Privacidade
- [ ] URL dos Termos de Serviço

### Classificação de Conteúdo
- [ ] Questionário preenchido
- [ ] Apostas simuladas: SIM
- [ ] Compras no app: SIM
- [ ] Classificação: +18

### Público-Alvo
- [ ] Idade mínima: 18 anos
- [ ] Público: Adultos

### Países
- [ ] Brasil ✅
- [ ] Portugal ✅
- [ ] Estados Unidos ✅
- [ ] Espanha ✅
- [ ] Outros (opcional)

---

## 💳 MONETIZAÇÃO (1 hora)

### Google Play Billing
- [ ] Produto criado: `premium_monthly`
- [ ] Nome: Premium Mensal
- [ ] Preço: $5.00 USD (ou R$ 25,00)
- [ ] Status: Ativo

### AdMob (Opcional)
- [ ] Conta criada
- [ ] App criado no AdMob
- [ ] Banner ID configurado
- [ ] Rewarded ID configurado

---

## 📤 UPLOAD (30 min)

### Criar Release
- [ ] Produção > Releases > Criar nova release
- [ ] Upload do `.aab`
- [ ] Notas da versão preenchidas
- [ ] Revisar todas as seções

### Enviar para Revisão
- [ ] Todas as seções completas
- [ ] Botão "Enviar para revisão" clicado
- [ ] Aguardar aprovação (1-7 dias)

---

## 🧪 TESTES (Opcional, mas Recomendado)

### Teste Interno
- [ ] Faixa de teste criada
- [ ] Emails de testadores adicionados
- [ ] Link de teste compartilhado
- [ ] Feedback coletado (1-2 semanas)

---

## ⚠️ ATENÇÃO: Apps de Apostas

### Evitar Rejeição
- [ ] Posicionar como "Análise Estatística"
- [ ] Não usar: "apostar", "ganhar dinheiro", "lucro"
- [ ] Usar: "análise", "estatísticas", "previsões"
- [ ] Disclaimer claro sobre jogo responsável
- [ ] Sem links para casas de apostas
- [ ] Foco educacional

---

## 📊 PÓS-LANÇAMENTO

### Monitoramento
- [ ] Configurar alertas de crash
- [ ] Monitorar avaliações
- [ ] Responder feedback
- [ ] Acompanhar métricas

### Marketing
- [ ] Criar página no Instagram
- [ ] Criar página no Facebook
- [ ] Criar canal no YouTube (tutoriais)
- [ ] Anunciar em grupos de futebol

---

## 🎯 TEMPO ESTIMADO TOTAL

| Etapa | Tempo |
|-------|-------|
| Assets | 30 min |
| Documentação | 1 hora |
| Configuração | 30 min |
| Build | 1 hora |
| Play Console | 2 horas |
| Monetização | 1 hora |
| Upload | 30 min |
| **TOTAL** | **~6-7 horas** |

**+ Aprovação Google:** 1-7 dias

---

## 📞 CONTATOS ÚTEIS

- **Google Play Console:** https://play.google.com/console
- **Suporte Google:** https://support.google.com/googleplay/android-developer
- **Expo EAS:** https://docs.expo.dev/build/introduction/
- **AdMob:** https://admob.google.com

---

## ✅ STATUS ATUAL

**Data de início:** ___/___/______

**Progresso:**
- [ ] Assets preparados
- [ ] Documentação criada
- [ ] Build gerado
- [ ] Play Console configurado
- [ ] App enviado para revisão
- [ ] App aprovado
- [ ] App publicado! 🎉

---

**Última atualização:** 5 de Maio de 2026
