# Documentação CI/CD - GoalEdge

## Visão Geral

Este documento explica como configurar e usar o pipeline CI/CD do GoalEdge.

---

## 1. Estrutura do Projeto

### Tipo Detectado: **Expo + EAS Build**

```
app_limpo_sdk54/
├── .github/
│   └── workflows/
│       ├── android-ci.yml      # Pipeline principal
│       └── local-validate.yml   # Validação rápida
├── app.json                    # Config Expo
├── package.json                # Dependências
└── android/                   # Diretório Android (gerado pelo EAS)
```

---

## 2. Pipelines Criados

### 2.1 android-ci.yml (Principal)

**Jobs:**
1. `detect-project` - Detecta tipo de projeto
2. `setup` - Configura ambiente
3. `validate` - Lint + TypeScript + Testes
4. `build` - Build APK/AAB
5. `notify` - Notificação

**Gatilhos:**
- Push para `main` e `develop`
- Pull Requests
- Release published
- Manual (`workflow_dispatch`)

### 2.2 local-validate.yml (Rápido)

- Para branches `feature/*`, `fix/*`, `hotfix/*`
- Validação leve: TypeScript + ESLint

---

## 3. Configuração de Secrets

### GitHub Secrets necessários:

| Secret | Descrição | Obrigatório |
|--------|-----------|------------|
| `EXPO_TOKEN` | Token EAS para build | Sim (para EAS) |
| `ANDROID_SIGNING_KEY` | Chave de assinatura (Base64) | Sim (para release) |
| `KEYSTORE_PASSWORD` | Senha do keystore | Sim (para release) |
| `KEY_ALIAS` | Alias da chave | Sim (para release) |
| `KEY_PASSWORD` | Senha da chave | Sim (para release) |

---

## 4. Como Configurar Secrets

### 4.1 Expo Token

1. Acesse: https://expo.dev/settings
2. Vá em "Access Tokens"
3. Crie um novo token
4. No GitHub: Settings → Secrets → New repository secret
5. Nome: `EXPO_TOKEN`
6. Valor: seu token

### 4.2 Assinatura Android

#### Opção A: Google Play Console (Recomendado)

1. Crie uma conta de serviço em Google Play Console
2. Baixe o arquivo JSON
3. Extraia a chave privada
4. Converta para Base64:
   ```bash
   base64 -w 0 your-key.keystore
   ```
5. Adicione no GitHub como `ANDROID_SIGNING_KEY`

#### Opção B: Keystore local

```bash
# Gerar keystore
keytool -genkeypair -v -storetype PKCS12 -keystore goaledge.keystore -alias goaledge -keyalg RSA -keysize 2048 -validity 10000

# Exportar para Base64
base64 -w 0 goaledge.keystore > keystore_base64.txt
```

---

## 5. Workflows por Tipo de Projeto

### Expo + EAS (Atual)

```yaml
# Build usa EAS
has_eas: true
build_system: eas

# Commands:
npx eas build -p android --profile release
```

### React Native CLI

```yaml
# Build usa Gradle
has_eas: false
build_system: gradle

# Commands:
./gradlew assembleRelease
./gradlew bundleRelease
```

---

## 6. Deploy Automático

### 6.1 Google Play Console

Adicione step após build:

```yaml
- name: Upload to Play Console
  uses: r0adkll/upload-google-play@v1
  with:
    service-account-json: ${{ secrets.GOOGLE_PLAY_SERVICE_JSON }}
    package-name: com.goaledge.app
    release-files: android/app/build/outputs/apk/release/*.apk
    track: internal  # internal/alpha/beta/production
```

### 6.2 Firebase App Distribution

```yaml
- name: Firebase App Distribution
  uses: wzieba/Firebase-Distribution-Github-Action@v1
  with:
    appId: ${{ secrets.FIREBASE_APP_ID }}
    serviceCredentialsFile: ${{ secrets.GOOGLE_APPLICATION_CREDENTIALS }}
    groups: testers
    file: android/app/build/outputs/apk/release/*.apk
```

### 6.3 TestFlight (iOS)

```ruby
# Adicione step para iOS (future)
- name: Upload to TestFlight
  uses: wzieba/upload-testflight-build-action@v1
  with:
    apiKey: ${{ secrets.APPLE_API_KEY }}
    apiKeyId: ${{ secrets.APPLE_API_KEY_ID }}
    issuerId: ${{ secrets.APPLE_ISSUER_ID }}
    appId: ${{ secrets.APPLE_APP_ID }}
```

---

## 7. Cache Inteligente

O pipeline usa caching automático:

| Cache | Path | Chave |
|------|------|------|
| npm | `node_modules` | `npm-{hash}` |
| Gradle | `~/.gradle/caches` | `gradle-{hash}` |

---

## 8. Executar Localmente

### Validar TypeScript:
```bash
npx tsc --noEmit
```

### Executar testes:
```bash
npm test
```

### Build local (Expo):
```bash
npx expo prebuild
cd android
./gradlew assembleDebug
```

### Build local (EAS):
```bash
npx eas build -p android --profile development
```

---

## 9. Status Badge

Adicione no seu README.md:

```markdown
[![Android CI](https://github.com/anomalyco/goaledge/actions/workflows/android-ci.yml/badge.svg)](https://github.com/anomalyco/goaledge/actions/workflows/android-ci.yml)
```

---

## 10. Estrutura Final

```
.github/
└── workflows/
    ├── android-ci.yml        # Pipeline principal (700+ linhas)
    └── local-validate.yml   # Validação rápida

# Artefatos gerados:
├── goaledge-debug.apk
├── goaledge-release.apk
└── goaledge.aab
```

---

## 11. Troubleshooting

### Erro: Gradle Permission Denied

```bash
chmod +x android/gradlew
```

### Erro: JAVA_HOME not set

Configure no workflow:
```yaml
env:
  JAVA_HOME: /usr/lib/jvm/java-17-openjdk-amd64
```

### Erro: Cache inválido

Limpe o cache:
```bash
rm -rf node_modules
rm -rf ~/.gradle/caches
```

---

## 12. Melhorias Futuras

- [ ] Adicionar SonarQube
- [ ] Adicionar Snyk (segurança)
- [ ] Adicionar Percy (UI tests)
- [ ] Adicionar Slack notifications
- [ ] Adicionar deploy automático para Google Play
- [ ] Adicionar Firebase App Distribution
- [ ] Adicionar iOS pipeline
- [ ] Adicionar matriz de build (multiple API levels)
- [ ] Adicionar test coverage reports
- [ ] Adicionar performance tests

---

## 13. Suporte

Para dúvidas, abra uma issue em: https://github.com/anomalyco/goaledge/issues