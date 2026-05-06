# 🚨 INSTRUÇÕES DE DEPLOY URGENTE

**Problema:** Jogos de amanhã não aparecem nas múltiplas de hoje + jogos antigos travados  
**Solução:** Deploy de 2 funções modificadas  
**Tempo:** 10 minutos

---

## 📋 PASSO A PASSO

### **1. Acessar Supabase Dashboard**

Abra: https://supabase.com/dashboard/project/pgglewzdzqbisidecndz/functions

---

### **2. Deploy da Função `generate-daily-picks`**

**2.1.** Clique em **"generate-daily-picks"** na lista  
**2.2.** Clique em **"Edit"** ou **"Deploy new version"**  
**2.3.** Copie TODO o conteúdo do arquivo:  
```
supabase/functions/generate-daily-picks/index.ts
```

**2.4.** Cole no editor do Supabase  
**2.5.** Clique em **"Deploy"**  
**2.6.** Aguarde confirmação de sucesso

---

### **3. Deploy da Função `update-results`**

**3.1.** Volte para a lista de funções  
**3.2.** Clique em **"update-results"**  
**3.3.** Clique em **"Edit"** ou **"Deploy new version"**  
**3.4.** Copie TODO o conteúdo do arquivo:  
```
supabase/functions/update-results/index.ts
```

**3.5.** Cole no editor do Supabase  
**3.6.** Clique em **"Deploy"**  
**3.7.** Aguarde confirmação de sucesso

---

### **4. Executar Manualmente (IMPORTANTE!)**

Após o deploy, execute estes comandos no terminal:

**4.1. Atualizar jogos antigos (marcar como void):**
```bash
curl -X POST "https://pgglewzdzqbisidecndz.supabase.co/functions/v1/update-results" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w"
```

**Resultado esperado:** `{"success":true,"updated":9}`  
(9 jogos marcados como void)

**4.2. Gerar picks de amanhã:**
```bash
curl -X POST "https://pgglewzdzqbisidecndz.supabase.co/functions/v1/generate-daily-picks?force=true" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w"
```

**Resultado esperado:** `{"success":true,"date":"2026-05-07","picksCreated":4}`  
(Picks criados para amanhã)

---

### **5. Verificar no App**

**5.1.** Abra o app  
**5.2.** Vá para a tela **"Hoje"**  
**5.3.** Puxe para baixo para recarregar  
**5.4.** Verifique:
- ✅ Jogos antigos não aparecem mais (ou aparecem como "void")
- ✅ Jogos de amanhã aparecem nas múltiplas

---

## 🎯 O QUE MUDOU?

### **Função `generate-daily-picks`**
- **ANTES:** Gerava picks para hoje
- **DEPOIS:** Gera picks para amanhã
- **Impacto:** Jogos de amanhã viram múltiplas de hoje

### **Função `update-results`**
- **ANTES:** Jogos sem resultado ficavam pending para sempre
- **DEPOIS:** Jogos que passaram + 2h sem resultado → marcados como "void"
- **Impacto:** Múltiplas não ficam travadas

---

## ⚠️ IMPORTANTE

1. **Cron Job:** A partir de amanhã (07/05) às 06:00 UTC, o cron vai gerar picks para 08/05 automaticamente
2. **Timezone:** Cron roda em UTC (03:00 BRT)
3. **Void:** Jogos marcados como "void" não contam como vitória nem derrota
4. **API-Football:** Ligas menores podem ter delay, por isso o timeout de 2h

---

## 📞 SUPORTE

Se algo der errado:
1. Verifique os logs das funções no Supabase Dashboard
2. Execute os comandos do passo 4 novamente
3. Verifique se o deploy foi feito corretamente

---

**Criado em:** 06/05/2026 - 18:00 UTC  
**Prioridade:** 🔴 URGENTE  
**Tempo Estimado:** 10 minutos
