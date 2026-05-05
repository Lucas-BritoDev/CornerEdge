# Template Base - Expo SDK 54

Template limpo e pronto para desenvolvimento de aplicativos React Native com Expo.

## 🚀 Stack

- **Expo SDK**: 54.0.0
- **React Native**: 0.81.0
- **React**: 19.1.0
- **TypeScript**: 5.9.2
- **Expo Router**: 6.0.0 (navegação file-based)
- **React Native Reanimated**: 4.0.0

## 📱 Funcionalidades Incluídas

- ✅ Autenticação completa (login, cadastro, recuperação de senha)
- ✅ Tema claro/escuro
- ✅ Navegação configurada (Expo Router)
- ✅ Context API (Auth e Theme)
- ✅ TypeScript configurado
- ✅ Componentes base (Header, LoadingSpinner, EmptyState)
- ✅ Serviços (Analytics, Storage, Offline Sync, Ads)

## 🎯 Estrutura do Projeto

```
├── app/                    # Páginas (file-based routing)
│   ├── index.tsx          # Dashboard inicial
│   ├── login.tsx          # Login
│   ├── signup.tsx         # Cadastro
│   ├── forgot-password.tsx
│   ├── new-password.tsx
│   ├── goodbye.tsx
│   ├── onboarding.tsx
│   └── _layout.tsx        # Layout raiz
├── components/            # Componentes reutilizáveis
├── constants/             # Temas e constantes
├── context/              # Context API (Auth, Theme)
├── hooks/                # Custom hooks
├── services/             # Serviços (API, storage, etc)
└── types/                # TypeScript types
```

## 🛠️ Instalação

```bash
npm install
```

## 🏃 Executar

```bash
# Desenvolvimento
npx expo start

# Android
npx expo start --android

# iOS
npx expo start --ios

# Web
npx expo start --web
```

## 📦 Build

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

## 🧪 Verificar Saúde do Projeto

```bash
npx expo-doctor
```

## 📝 Notas

- O warning do Reanimated sobre "Reduced motion" é apenas informativo e aparece quando o dispositivo tem configurações de acessibilidade ativadas
- Todas as dependências estão atualizadas e compatíveis com Expo SDK 54
- Template pronto para começar o desenvolvimento do seu app

## 🎨 Personalização

1. Atualize `app.json` com informações do seu app
2. Substitua os ícones em `assets/images/`
3. Modifique as cores em `constants/theme.ts`
4. Adicione suas funcionalidades em `app/`

---

**Template Base v1.0.0** - Pronto para uso! 🚀
