# 🔒 DATA SAFETY - GOOGLE PLAY CONSOLE

**Projeto:** GoalEdge  
**Versão:** 1.0.0  
**Data:** 05/05/2026

Este documento contém todas as informações necessárias para preencher a seção **Data Safety** no Google Play Console.

---

## 📋 VISÃO GERAL

O Data Safety é uma seção obrigatória do Google Play Console onde você deve declarar:
- Quais dados são coletados
- Como os dados são usados
- Se os dados são compartilhados com terceiros
- Práticas de segurança implementadas

---

## 1️⃣ DADOS COLETADOS

### ✅ Informações Pessoais

#### Email
- **Coletado:** ✅ SIM
- **Obrigatório:** ✅ SIM
- **Finalidade:** Autenticação e comunicação
- **Compartilhado:** ❌ NÃO
- **Pode ser excluído:** ✅ SIM

#### Nome
- **Coletado:** ✅ SIM
- **Obrigatório:** ✅ SIM
- **Finalidade:** Personalização do perfil
- **Compartilhado:** ❌ NÃO
- **Pode ser excluído:** ✅ SIM

### ✅ Atividade no App

#### Histórico de Visualizações
- **Coletado:** ✅ SIM
- **Obrigatório:** ❌ NÃO
- **Finalidade:** Melhorar experiência do usuário
- **Compartilhado:** ❌ NÃO
- **Pode ser excluído:** ✅ SIM

#### Preferências do Usuário
- **Coletado:** ✅ SIM
- **Obrigatório:** ❌ NÃO
- **Finalidade:** Personalização (idioma, tema)
- **Compartilhado:** ❌ NÃO
- **Pode ser excluído:** ✅ SIM

### ✅ Identificadores de Dispositivo

#### Token de Notificações Push
- **Coletado:** ✅ SIM
- **Obrigatório:** ❌ NÃO
- **Finalidade:** Envio de notificações
- **Compartilhado:** ❌ NÃO
- **Pode ser excluído:** ✅ SIM

#### ID de Publicidade (AdMob)
- **Coletado:** ✅ SIM (via AdMob)
- **Obrigatório:** ❌ NÃO
- **Finalidade:** Publicidade personalizada
- **Compartilhado:** ✅ SIM (Google AdMob)
- **Pode ser excluído:** ✅ SIM

---

## 2️⃣ FINALIDADES DE USO DOS DADOS

### Funcionalidade do App
- ✅ Autenticação de usuários
- ✅ Personalização da experiência
- ✅ Sincronização entre dispositivos

### Análise e Performance
- ✅ Análise de uso do app
- ✅ Identificação de bugs e crashes
- ✅ Melhoria de performance

### Comunicação
- ✅ Notificações sobre picks diárias
- ✅ Atualizações de resultados
- ✅ Comunicações importantes

### Publicidade
- ✅ Exibição de anúncios
- ✅ Personalização de anúncios (via AdMob)

---

## 3️⃣ COMPARTILHAMENTO DE DADOS

### Serviços de Terceiros

#### Supabase (Infraestrutura)
- **Dados compartilhados:** Email, nome, preferências, histórico
- **Finalidade:** Armazenamento e autenticação
- **Localização:** Estados Unidos
- **Política:** https://supabase.com/privacy

#### Google AdMob (Publicidade)
- **Dados compartilhados:** ID de publicidade, dados de uso
- **Finalidade:** Exibição de anúncios
- **Localização:** Estados Unidos
- **Política:** https://policies.google.com/privacy

#### API-Football (Dados Esportivos)
- **Dados compartilhados:** ❌ NENHUM
- **Finalidade:** Obtenção de dados de partidas
- **Observação:** Apenas o servidor faz requisições

---

## 4️⃣ PRÁTICAS DE SEGURANÇA

### Criptografia em Trânsito
- ✅ **SIM** - Todos os dados são transmitidos via HTTPS/TLS
- Conexões seguras com Supabase
- Conexões seguras com API-Football

### Criptografia em Repouso
- ✅ **SIM** - Dados armazenados criptografados no Supabase
- Senhas com hash bcrypt
- Tokens JWT seguros

### Exclusão de Dados
- ✅ **SIM** - Usuários podem solicitar exclusão de conta
- Processo: Configurações > Perfil > Excluir Conta
- Prazo: Imediato (dados removidos em até 30 dias)

### Conformidade
- ✅ LGPD (Lei Geral de Proteção de Dados - Brasil)
- ✅ GDPR (General Data Protection Regulation - Europa)
- ✅ COPPA (Children's Online Privacy Protection Act - EUA)

---

## 5️⃣ RESPOSTAS PARA O FORMULÁRIO DATA SAFETY

### Seção 1: Coleta de Dados

**Seu app coleta ou compartilha dados de usuários?**
- ✅ SIM

**Todos os dados coletados são criptografados em trânsito?**
- ✅ SIM

**Você oferece uma maneira para os usuários solicitarem a exclusão de seus dados?**
- ✅ SIM

---

### Seção 2: Tipos de Dados

#### Informações Pessoais

**Nome**
- Coletado: ✅ SIM
- Compartilhado: ❌ NÃO
- Opcional: ❌ NÃO (obrigatório)
- Finalidade: Funcionalidade do app

**Endereço de email**
- Coletado: ✅ SIM
- Compartilhado: ❌ NÃO
- Opcional: ❌ NÃO (obrigatório)
- Finalidade: Funcionalidade do app, Comunicação

#### Atividade no App

**Interações no app**
- Coletado: ✅ SIM
- Compartilhado: ❌ NÃO
- Opcional: ✅ SIM
- Finalidade: Análise, Funcionalidade do app

**Histórico de pesquisa no app**
- Coletado: ✅ SIM
- Compartilhado: ❌ NÃO
- Opcional: ✅ SIM
- Finalidade: Análise, Funcionalidade do app

#### Identificadores de Dispositivo

**IDs de dispositivo ou outros IDs**
- Coletado: ✅ SIM
- Compartilhado: ✅ SIM (AdMob)
- Opcional: ✅ SIM
- Finalidade: Publicidade, Análise

---

### Seção 3: Práticas de Segurança

**Os dados são criptografados em trânsito?**
- ✅ SIM

**Os usuários podem solicitar a exclusão de dados?**
- ✅ SIM

**Você segue as práticas recomendadas de segurança de dados?**
- ✅ SIM

**Seu app passou por uma avaliação de segurança independente?**
- ❌ NÃO (opcional)

---

### Seção 4: Compartilhamento de Dados

**Você compartilha dados com terceiros?**
- ✅ SIM

**Parceiros com quem você compartilha:**
- Google AdMob (Publicidade)
- Supabase (Infraestrutura - mas não é "compartilhamento" no sentido do Google)

**Finalidade do compartilhamento:**
- Publicidade
- Funcionalidade do app

---

## 6️⃣ POLÍTICA DE PRIVACIDADE

### URL da Política
**Obrigatório:** ✅ SIM

**Onde hospedar:**
- GitHub Pages (gratuito)
- Vercel (gratuito)
- Netlify (gratuito)
- Website próprio

**Exemplo de URL:**
```
https://goaledge.app/privacy-policy
https://goaledge.github.io/privacy-policy
https://goaledge.vercel.app/privacy-policy
```

### Conteúdo Mínimo

A política deve incluir:
1. ✅ Quais dados são coletados
2. ✅ Como os dados são usados
3. ✅ Com quem os dados são compartilhados
4. ✅ Como os dados são protegidos
5. ✅ Direitos do usuário
6. ✅ Como solicitar exclusão de dados
7. ✅ Informações de contato
8. ✅ Data da última atualização

---

## 7️⃣ CLASSIFICAÇÃO DE CONTEÚDO

### Categoria do App
- **Categoria:** Esportes
- **Subcategoria:** Análise Estatística

### Classificação Indicativa

**Recomendação:** 12+ ou 16+

**Justificativa:**
- Conteúdo relacionado a apostas (mesmo que informativo)
- Requer maturidade para uso responsável
- Publicidade presente

### Questionário de Classificação

**Seu app contém:**

1. **Violência**
   - ❌ NÃO

2. **Conteúdo Sexual**
   - ❌ NÃO

3. **Linguagem Imprópria**
   - ❌ NÃO

4. **Drogas, Álcool ou Tabaco**
   - ❌ NÃO

5. **Jogos de Azar ou Apostas**
   - ⚠️ **CONTEÚDO RELACIONADO**
   - Não facilita apostas
   - Apenas análise estatística
   - Conteúdo educacional

6. **Compras no App**
   - ✅ SIM (Assinatura Premium)

7. **Publicidade**
   - ✅ SIM (AdMob)

---

## 8️⃣ INFORMAÇÕES ADICIONAIS

### Público-Alvo

**Seu app é direcionado a crianças?**
- ❌ NÃO

**Faixa etária:**
- 18+ (recomendado)
- 16+ (mínimo aceitável)

### Funcionalidades Sensíveis

**Seu app acessa localização?**
- ❌ NÃO

**Seu app acessa câmera?**
- ❌ NÃO

**Seu app acessa microfone?**
- ❌ NÃO

**Seu app acessa contatos?**
- ❌ NÃO

**Seu app acessa fotos/mídia?**
- ❌ NÃO

---

## 9️⃣ DECLARAÇÃO DE CONFORMIDADE

### Texto para o Play Console

```
O aplicativo GoalEdge coleta dados pessoais (email e nome) para 
autenticação e personalização. Também coletamos dados de uso do 
app para análise e melhoria da experiência.

Todos os dados são criptografados em trânsito (HTTPS/TLS) e em 
repouso. Não vendemos dados de usuários a terceiros.

Compartilhamos dados de publicidade com o Google AdMob para 
exibição de anúncios personalizados.

Os usuários podem solicitar a exclusão de seus dados a qualquer 
momento através das configurações do app ou entrando em contato 
conosco.

Estamos em conformidade com LGPD, GDPR e COPPA.

Para mais informações, consulte nossa Política de Privacidade.
```

---

## 🔟 CHECKLIST FINAL

Antes de enviar para revisão:

### Documentação
- [ ] Política de privacidade criada
- [ ] Política hospedada publicamente
- [ ] URL da política adicionada ao Play Console
- [ ] Termos de uso criados

### Data Safety
- [ ] Todos os dados coletados declarados
- [ ] Finalidades de uso especificadas
- [ ] Compartilhamento com terceiros declarado
- [ ] Práticas de segurança documentadas

### Classificação
- [ ] Categoria correta selecionada
- [ ] Classificação indicativa definida
- [ ] Questionário de conteúdo preenchido

### Contato
- [ ] Email de suporte configurado
- [ ] Website (se houver) adicionado
- [ ] Informações de contato verificadas

---

## 📞 SUPORTE

**Email:** contato@goaledge.app  
**Website:** https://goaledge.app (a criar)

---

## 📚 REFERÊNCIAS

- [Data Safety no Play Console](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Política de Privacidade do Google](https://policies.google.com/privacy)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
- [GDPR - General Data Protection Regulation](https://gdpr.eu/)

---

**Documento criado por:** Kiro AI  
**Data:** 05/05/2026  
**Versão:** 1.0
