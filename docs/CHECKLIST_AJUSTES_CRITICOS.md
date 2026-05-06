# ✅ CHECKLIST DE AJUSTES CRÍTICOS - PLAY STORE

**Projeto:** GoalEdge  
**Versão:** 1.0.0  
**Prazo Estimado:** 1-2 horas

---

## 🔴 AJUSTES CRÍTICOS (Obrigatórios)

### 1. Criar Keystore de Produção
**Tempo:** 10 minutos  
**Prioridade:** 🔴 CRÍTICA

```bash
# Gerar keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore @luck1993__goaledge.jks \
  -alias goaledge \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Informações necessárias:
# - Password do keystore (guardar em local seguro!)
# - Password da key (pode ser o mesmo)
# - Nome: Lucas (ou seu nome)
# - Organização: GoalEdge
# - Cidade, Estado, País
```

**Após criar:**
- [ ] Salvar keystore em local seguro
- [ ] Fazer backup do keystore
- [ ] Anotar passwords em gerenciador de senhas
- [ ] NUNCA commitar keystore no Git

**Configurar no EAS:**
```bash
# Configurar credenciais
eas credentials

# Selecionar:
# 1. Android
# 2. Production
# 3. Set up a new keystore
# 4. Upload do arquivo .jks
# 5. Informar passwords
```

---

### 2. Configurar AdMob Application ID
**Tempo:** 30 minutos  
**Prioridade:** 🔴 CRÍTICA

**Passos:**

1. **Criar conta no AdMob**
   - Acessar: https://admob.google.com
   - Fazer login com conta Google
   - Aceitar termos de serviço

2. **Criar aplicativo**
   - Clicar em "Apps" > "Add App"
   - Selecionar "Android"
   - Nome: GoalEdge
   - Package name: `com.goaledge.app`

3. **Obter Application ID**
   - Copiar ID (formato: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

4. **Atualizar AndroidManifest.xml**
   ```xml
   <meta-data 
     android:name="com.google.android.gms.ads.APPLICATION_ID" 
     android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
   ```

5. **Criar unidades de anúncio**
   - Banner: Para tela principal
   - Rewarded: Para desbloquear picks premium

**Checklist:**
- [ ] Conta AdMob criada
- [ ] App registrado no AdMob
- [ ] Application ID obtido
- [ ] AndroidManifest.xml atualizado
- [ ] Unidades de anúncio criadas

---

### 3. Remover Permissões Desnecessárias
**Tempo:** 5 minutos  
**Prioridade:** 🔴 CRÍTICA

**Arquivo:** `android/app/src/main/AndroidManifest.xml`

**Remover estas linhas:**
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
```

**Manter apenas:**
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

**Checklist:**
- [ ] Permissões removidas
- [ ] App testado após remoção
- [ ] Nenhuma funcionalidade quebrada

---

## ⚠️ AJUSTES IMPORTANTES (Recomendados)

### 4. Criar Política de Privacidade
**Tempo:** 2 horas  
**Prioridade:** ⚠️ ALTA

**Conteúdo Mínimo:**

```markdown
# Política de Privacidade - GoalEdge

Última atualização: [DATA]

## 1. Dados Coletados
- Email (autenticação)
- Nome (perfil do usuário)
- Preferências (idioma, tema)
- Histórico de visualizações
- Token de notificações push

## 2. Uso dos Dados
- Autenticação e segurança
- Personalização da experiência
- Envio de notificações
- Análise de uso do app

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

**Onde hospedar:**
- GitHub Pages (gratuito)
- Vercel (gratuito)
- Netlify (gratuito)

**Checklist:**
- [ ] Documento criado
- [ ] Hospedado publicamente
- [ ] URL acessível
- [ ] Link adicionado ao app

---

### 5. Criar Termos de Uso
**Tempo:** 1 hora  
**Prioridade:** ⚠️ ALTA

**Conteúdo Mínimo:**

```markdown
# Termos de Uso - GoalEdge

## 1. Aceitação dos Termos
Ao usar o GoalEdge, você concorda com estes termos.

## 2. Descrição do Serviço
Análise estatística de partidas de futebol para fins educacionais.

## 3. Uso Responsável
- Conteúdo apenas informativo
- Não garantimos resultados
- Não promovemos apostas
- Usuário é responsável por suas decisões

## 4. Assinatura Premium
- Preço: $5.00/mês
- Cancelamento a qualquer momento
- Sem reembolso proporcional

## 5. Limitação de Responsabilidade
Não nos responsabilizamos por perdas financeiras.

## 6. Modificações
Podemos alterar estes termos a qualquer momento.

## 7. Contato
Email: contato@goaledge.app
```

**Checklist:**
- [ ] Documento criado
- [ ] Hospedado publicamente
- [ ] URL acessível
- [ ] Link adicionado ao app

---

### 6. Preparar Screenshots
**Tempo:** 1 hora  
**Prioridade:** ⚠️ ALTA

**Especificações:**
- Formato: PNG ou JPG
- Tamanho: 1080x1920px (portrait)
- Mínimo: 2 screenshots
- Recomendado: 4-8 screenshots

**Telas Sugeridas:**
1. **Home** - Picks do dia
2. **Detalhes** - Análise de uma pick
3. **Resultados** - Histórico
4. **Premium** - Features premium
5. **Perfil** - Configurações

**Como capturar:**
```bash
# Usar emulador Android
# Resolução: 1080x1920
# Capturar telas principais
# Editar se necessário (adicionar moldura, etc)
```

**Checklist:**
- [ ] 4-8 screenshots capturados
- [ ] Tamanho correto (1080x1920)
- [ ] Formato PNG
- [ ] Conteúdo representativo
- [ ] Sem informações sensíveis

---

### 7. Criar Feature Graphic
**Tempo:** 30 minutos  
**Prioridade:** ⚠️ ALTA

**Especificações:**
- Formato: PNG ou JPG
- Tamanho: 1024x500px
- Conteúdo: Logo + Slogan

**Sugestão de Design:**
```
┌─────────────────────────────────────┐
│                                     │
│   [LOGO]    GoalEdge                │
│                                     │
│   Análise Estatística de Futebol   │
│                                     │
└─────────────────────────────────────┘
```

**Ferramentas:**
- Canva (gratuito)
- Figma (gratuito)
- Photoshop

**Checklist:**
- [ ] Graphic criado
- [ ] Tamanho correto (1024x500)
- [ ] Logo incluído
- [ ] Slogan incluído
- [ ] Cores da marca

---

### 8. Definir Informações de Contato
**Tempo:** 30 minutos  
**Prioridade:** ⚠️ ALTA

**Necessário:**

1. **Email de Suporte**
   - Criar: contato@goaledge.app
   - Ou usar: goaledge.suporte@gmail.com
   - Configurar auto-resposta

2. **Website (Opcional)**
   - Landing page simples
   - Informações do app
   - Links para políticas

3. **Redes Sociais (Opcional)**
   - Instagram: @goaledge
   - Twitter: @goaledge
   - Facebook: /goaledge

**Checklist:**
- [ ] Email criado
- [ ] Auto-resposta configurada
- [ ] Website criado (opcional)
- [ ] Redes sociais criadas (opcional)

---

## 📋 ORDEM DE EXECUÇÃO RECOMENDADA

### Fase 1: Configurações Técnicas (1 hora)
1. ✅ Criar keystore de produção (10 min)
2. ✅ Configurar AdMob (30 min)
3. ✅ Remover permissões (5 min)
4. ✅ Testar app (15 min)

### Fase 2: Documentação Legal (3 horas)
5. ✅ Criar política de privacidade (2 horas)
6. ✅ Criar termos de uso (1 hora)

### Fase 3: Assets Visuais (1.5 horas)
7. ✅ Preparar screenshots (1 hora)
8. ✅ Criar feature graphic (30 min)

### Fase 4: Informações de Contato (30 min)
9. ✅ Definir email de suporte (30 min)

**TEMPO TOTAL: ~6 horas**

---

## 🚀 APÓS COMPLETAR CHECKLIST

### Gerar Build de Produção
```bash
# Login no EAS
eas login

# Gerar build AAB
eas build --platform android --profile production

# Aguardar conclusão (15-20 minutos)
```

### Upload para Play Console
1. Acessar [Google Play Console](https://play.google.com/console)
2. Criar novo aplicativo
3. Preencher todas as informações
4. Upload do AAB
5. Preencher Data Safety
6. Enviar para revisão

### Aguardar Aprovação
- Tempo médio: 1-7 dias
- Acompanhar status no Play Console
- Responder a possíveis solicitações do Google

---

## 📞 SUPORTE

Se tiver dúvidas durante o processo:
1. Consultar documentação oficial do Google Play
2. Verificar guia `PUBLICACAO_PLAY_STORE.md`
3. Consultar comunidade Expo/React Native

---

**Checklist criado por:** Kiro AI  
**Data:** 05/05/2026  
**Versão:** 1.0
