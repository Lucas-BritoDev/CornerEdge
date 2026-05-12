# Remoção do Onboarding - Resumo das Alterações

## ✅ Alterações Realizadas

### CornerEdge
1. **Removido arquivo**: `app/onboarding.tsx`
2. **AuthContext.tsx**:
   - Removida constante `ONBOARDING_KEY`
   - Removido import de `AsyncStorage`
   - Removido estado `isOnboarded`
   - Removida função `completeOnboarding()`
   - Removida leitura do AsyncStorage na inicialização
3. **app/_layout.tsx**:
   - Removida rota `onboarding` do Stack
   - Simplificado `AuthGate` para ir direto para login quando não autenticado
   - Removida lógica de verificação de onboarding

### GoalEdge (app_limpo_sdk54)
1. **Removido arquivo**: `app/onboarding.tsx`
2. **AuthContext.tsx**:
   - Removida constante `ONBOARDING_KEY`
   - Removido import de `AsyncStorage`
   - Removido estado `isOnboarded`
   - Removida função `completeOnboarding()`
   - Removida leitura do AsyncStorage na inicialização
3. **app/_layout.tsx**:
   - Removida rota `onboarding` do Stack
   - Simplificado `AuthGate` para ir direto para login quando não autenticado
   - Removida lógica de verificação de onboarding

## 🔄 Novo Fluxo de Navegação

### Antes:
```
App Inicia → Verifica Onboarding → Onboarding Screen → Login → Home
```

### Agora:
```
App Inicia → Login → Home
```

## ⚠️ Observações

### Arquivos de Tradução
Os arquivos de tradução ainda contêm as chaves de onboarding:
- `locales/pt.json`
- `locales/en.json`
- `locales/es.json`

**Ação recomendada**: Remover as seções `onboarding` dos arquivos de tradução (opcional, não afeta funcionamento).

### AsyncStorage
Os usuários existentes ainda podem ter a chave `@corneredge:onboarded` ou `@goaledge:onboarded` no AsyncStorage, mas isso não afeta o funcionamento pois não é mais verificada.

## 🐛 Problema das Picks Diárias (GoalEdge)

### Análise do Código
O código em `app/(tabs)/index.tsx` está correto:
- Usa `useTodayPicks()` com `enabled: !authLoading && !!user`
- Tem tratamento de erro adequado
- Tem loading states corretos

### Possíveis Causas
1. **Problema no banco de dados**: Verificar se há picks para hoje na tabela `daily_picks`
2. **Problema na query**: A query pode estar retornando vazio
3. **Problema de timezone**: A data pode estar sendo calculada incorretamente

### Debug Recomendado
Execute no console do app ou adicione logs temporários:
```javascript
// Verificar data atual
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
console.log('Data de hoje:', today);

// Verificar picks no banco
const { data, error } = await supabase
  .from('daily_picks')
  .select('*')
  .eq('pick_date', today);
console.log('Picks encontradas:', data?.length, data);
```

### Próximos Passos
1. Verificar se a Edge Function `generate-daily-picks` está rodando
2. Verificar se há dados na tabela `daily_picks` para a data de hoje
3. Verificar logs do Supabase para erros na query
4. Testar manualmente a geração de picks
