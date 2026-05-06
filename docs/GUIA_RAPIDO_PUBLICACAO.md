# ⚡ GUIA RÁPIDO DE PUBLICAÇÃO

**Tempo Total:** 6-8 horas + 1-7 dias aprovação  
**Dificuldade:** Média  
**Pré-requisitos:** Conta Google, Conta EAS

---

## 🚀 INÍCIO RÁPIDO

### Passo 1: Ajustes Críticos (1 hora)

#### 1.1 Criar Keystore (10 min)
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore @luck1993__goaledge.jks \
  -alias goaledge \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Informações necessárias:**
- Password do keystore (guardar!)
- Password da key (pode ser o mesmo)
- Nome, Organização, Cidade, Estado, País

**⚠️ IMPORTANTE:** Fazer backup do keystore!

#### 1.2 Configurar AdMob (30 min)
1. Acessar https://admob.google.com
2. Criar conta / Fazer login
3. Apps > Add App > Android
4. Nome: GoalEdge
5. Package: `com.goaledge.app`
6. Copiar Application ID (formato: `ca-app-pub-XXXXXXXX~YYYYYY`)

**Atualizar AndroidManifest.xml:**
```xml
<!-- Trocar esta linha: -->
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" 
           android:value="ca-app-pub-xxxxxxxx~xxxxxxxx"/>

<!-- Por: -->
<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" 
           android:value="SEU_ID_REAL_AQUI"/>
```

#### 1.3 Remover Permissões (5 min)
**Arquivo:** `android/app/src/main/AndroidManifest.xml`

**Remover estas 3 linhas:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
```

#### 1.4 Testar App (15 min)
```bash
npm start
# Testar no emulador/dispositivo
# Verificar se tudo funciona
```

---

### Passo 2: Documentação Legal (3 horas)

#### 2.1 Política de Privacidade (2 horas)

**Template básico:**
```markdown
# Política de Privacidade - GoalEdge

Última atualização: [DATA]

## 1. Dados Coletados
- Email (autenticação)
- Nome (perfil)
- Preferências (idioma, tema)
- Histórico de visualizações

## 2. Uso dos Dados
- Autenticação e segurança
- Personalização da experiência
- Envio de notificações

## 3. Compartilhamento
- Supabase (infraestrutura)
- Google AdMob (publicidade)
- Não vendemos seus dados

## 4. Segurança
- Dados criptografados
- Acesso restrito
- Conformidade com LGPD/GDPR

## 5. Seus Direitos
- Acessar seus dados
- Solicitar exclusão
- Revogar consentimento

## 6. Contato
Email: contato@goaledge.app
```

**Onde hospedar (gratuito):**
- GitHub Pages
- Vercel
- Netlify

#### 2.2 Termos de Uso (1 hora)

**Template básico:**
```markdown
# Termos de Uso - GoalEdge

## 1. Aceitação
Ao usar o GoalEdge, você concorda com estes termos.

## 2. Serviço
Análise estatística de futebol para fins educacionais.

## 3. Uso Responsável
- Conteúdo apenas informativo
- Não garantimos resultados
- Não promovemos apostas

## 4. Assinatura Premium
- Preço: $5.00/mês
- Cancelamento a qualquer momento

## 5. Limitação de Responsabilidade
Não nos responsabilizamos por perdas financeiras.

## 6. Contato
Email: contato@goaledge.app
```

---

### Passo 3: Assets Visuais (1.5 horas)

#### 3.1 Screenshots (1 hora)

**Especificações:**
- Tamanho: 1080x1920px (portrait)
- Formato: PNG
- Quantidade: Mínimo 2, recomendado 4-8

**Telas sugeridas:**
1. Home com picks do dia
2. Detalhes de uma pick
3. Resultados históricos
4. Tela Premium

**Como capturar:**
```bash
# Usar emulador Android
# Resolução: 1080x1920
# Capturar telas
# Salvar como PNG
```

#### 3.2 Feature Graphic (30 min)

**Especificações:**
- Tamanho: 1024x500px
- Formato: PNG ou JPG

**Conteúdo:**
- Logo GoalEdge
- Slogan: "Análise Estatística de Futebol"
- Cores da marca (Laranja, Preto, Branco)

**Ferramentas:**
- Canva (gratuito)
- Figma (gratuito)

---

### Passo 4: Informações de Contato (30 min)

#### 4.1 Email de Suporte
**Opções:**
- Criar: contato@goaledge.app (se tiver domínio)
- Ou usar: goaledge.suporte@gmail.com

**Configurar:**
- Auto-resposta
- Assinatura profissional

#### 4.2 Website (Opcional)
**Landing page simples com:**
- Informações do app
- Links para políticas
- Contato

---

### Passo 5: Build e Upload (2 horas)

#### 5.1 Configurar EAS (10 min)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar credenciais
eas credentials
# Selecionar: Android > Production > Upload keystore
# Upload do arquivo .jks
# Informar passwords
```

#### 5.2 Gerar Build AAB (20 min)
```bash
# Gerar build de produção
eas build --platform android --profile production

# Aguardar conclusão (15-20 minutos)
# Download automático do AAB
```

#### 5.3 Criar App no Play Console (30 min)
1. Acessar https://play.google.com/console
2. Criar conta de desenvolvedor ($25 taxa única)
3. Criar novo aplicativo
4. Preencher informações básicas:
   - Nome: GoalEdge
   - Idioma padrão: Português
   - Tipo: App
   - Gratuito/Pago: Gratuito (com compras no app)

#### 5.4 Preencher Informações (1 hora)

**Ficha da loja:**
- Descrição curta (80 caracteres)
- Descrição completa (4000 caracteres)
- Screenshots (mínimo 2)
- Feature graphic
- Ícone do app

**Classificação de conteúdo:**
- Categoria: Esportes
- Questionário de classificação
- Classificação indicativa: 16+ ou 18+

**Data Safety:**
- Dados coletados: Email, Nome, Preferências
- Finalidade: Autenticação, Personalização
- Compartilhamento: AdMob (publicidade)
- Política de privacidade: URL

**Preços e distribuição:**
- Países: Selecionar todos (ou específicos)
- Preço: Gratuito
- Compras no app: Sim ($5.00/mês)

#### 5.5 Upload do AAB (10 min)
1. Produção > Criar nova versão
2. Upload do arquivo AAB
3. Preencher notas da versão
4. Revisar e publicar

---

## ✅ CHECKLIST FINAL

Antes de enviar para revisão:

### Técnico
- [ ] Keystore criado e backup feito
- [ ] AdMob ID real configurado
- [ ] Permissões desnecessárias removidas
- [ ] App testado e funcionando
- [ ] Build AAB gerado com sucesso

### Documentação
- [ ] Política de privacidade criada e hospedada
- [ ] Termos de uso criados e hospedados
- [ ] URLs das políticas acessíveis

### Assets
- [ ] Screenshots preparados (mínimo 2)
- [ ] Feature graphic criado
- [ ] Ícone do app correto

### Play Console
- [ ] Ficha da loja preenchida
- [ ] Classificação de conteúdo completa
- [ ] Data Safety preenchido
- [ ] Preços e distribuição configurados
- [ ] AAB uploaded

---

## 🎯 APÓS ENVIO

### O que esperar:
- **Tempo de revisão:** 1-7 dias (média: 2-3 dias)
- **Status:** Acompanhar no Play Console
- **Notificações:** Via email

### Possíveis resultados:
1. ✅ **Aprovado** - App publicado!
2. ⚠️ **Solicitação de informações** - Responder prontamente
3. ❌ **Rejeitado** - Corrigir problemas e reenviar

### Se aprovado:
- [ ] Trocar AdMob IDs de teste por IDs reais
- [ ] Configurar Google Play Billing
- [ ] Monitorar crashes e feedback
- [ ] Responder avaliações

### Se rejeitado:
- Ler motivo da rejeição
- Corrigir problemas
- Reenviar para revisão

---

## 🆘 PROBLEMAS COMUNS

### Build falha
**Solução:** Verificar logs do EAS, corrigir erros

### Keystore perdido
**Solução:** IMPOSSÍVEL recuperar! Sempre fazer backup

### Rejeição por conteúdo de apostas
**Solução:** Enfatizar aspecto educacional/estatístico

### Data Safety incompleto
**Solução:** Preencher todos os campos obrigatórios

---

## 📞 SUPORTE

### Documentação Completa
- `DOCS/AUDITORIA_TECNICA_PLAY_STORE.md`
- `DOCS/CHECKLIST_AJUSTES_CRITICOS.md`
- `DOCS/DATA_SAFETY_PLAY_CONSOLE.md`
- `PUBLICACAO_PLAY_STORE.md`

### Links Úteis
- [Google Play Console](https://play.google.com/console)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [AdMob](https://admob.google.com)

---

## 🎉 BOA SORTE!

Siga este guia passo a passo e você terá seu app publicado na Play Store em breve!

**Tempo total:** 6-8 horas de trabalho + 1-7 dias de aprovação

---

**Guia criado por:** Kiro AI  
**Data:** 05/05/2026  
**Versão:** 1.0
