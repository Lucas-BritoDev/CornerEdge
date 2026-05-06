# 🎨 Guia para Substituir a Logo do GoalEdge

## 📋 Arquivos que Precisam ser Substituídos

Você precisa criar 4 versões da nova logo e substituir os seguintes arquivos:

### 1. **icon.png** (Ícone Principal)
- **Caminho:** `assets/images/icon.png`
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG com fundo transparente
- **Uso:** Ícone principal do app (iOS/Android)

### 2. **adaptive-icon.png** (Ícone Adaptativo Android)
- **Caminho:** `assets/images/adaptive-icon.png`
- **Tamanho:** 1024x1024 pixels
- **Formato:** PNG com fundo transparente
- **Uso:** Ícone adaptativo do Android (foreground)
- **Importante:** Deixe 20% de margem nas bordas (área segura)

### 3. **splash.png** (Tela de Splash)
- **Caminho:** `assets/images/splash.png`
- **Tamanho:** 1284x2778 pixels (ou maior)
- **Formato:** PNG com fundo transparente
- **Uso:** Tela de carregamento inicial
- **Fundo:** Será #1A1A1A (definido no app.json)

### 4. **favicon.png** (Favicon Web)
- **Caminho:** `assets/images/favicon.png`
- **Tamanho:** 48x48 pixels
- **Formato:** PNG
- **Uso:** Ícone para versão web

---

## 🛠️ Como Criar as Versões

### Opção 1: Usar Ferramenta Online (Recomendado)

Use o **App Icon Generator** do Expo:
1. Acesse: https://www.appicon.co/
2. Faça upload da logo GoalEdge
3. Selecione "iOS & Android"
4. Baixe o pacote gerado
5. Substitua os arquivos em `assets/images/`

### Opção 2: Usar Photoshop/GIMP

#### Para icon.png e adaptive-icon.png (1024x1024):
1. Abra a logo no Photoshop/GIMP
2. Redimensione para 1024x1024 pixels
3. Mantenha fundo transparente
4. Para adaptive-icon: adicione 20% de margem (logo centralizada)
5. Exporte como PNG

#### Para splash.png (1284x2778):
1. Crie um canvas 1284x2778 pixels
2. Fundo transparente
3. Centralize a logo (tamanho ~600x600 pixels)
4. Exporte como PNG

#### Para favicon.png (48x48):
1. Redimensione a logo para 48x48 pixels
2. Exporte como PNG

### Opção 3: Usar ImageMagick (Linha de Comando)

```bash
# Instalar ImageMagick
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Criar icon.png (1024x1024)
magick goaledge-logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/images/icon.png

# Criar adaptive-icon.png (1024x1024 com margem)
magick goaledge-logo.png -resize 820x820 -background none -gravity center -extent 1024x1024 assets/images/adaptive-icon.png

# Criar splash.png (1284x2778)
magick goaledge-logo.png -resize 600x600 -background none -gravity center -extent 1284x2778 assets/images/splash.png

# Criar favicon.png (48x48)
magick goaledge-logo.png -resize 48x48 assets/images/favicon.png
```

---

## 📝 Passo a Passo Rápido

### 1. Salvar a Logo Original
Salve a imagem da logo que você enviou como `goaledge-logo.png` na raiz do projeto.

### 2. Executar Comandos
Se tiver ImageMagick instalado, execute:

```bash
# Navegar até a pasta do projeto
cd /caminho/do/projeto

# Criar todas as versões
magick goaledge-logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/images/icon.png
magick goaledge-logo.png -resize 820x820 -background none -gravity center -extent 1024x1024 assets/images/adaptive-icon.png
magick goaledge-logo.png -resize 600x600 -background none -gravity center -extent 1284x2778 assets/images/splash.png
magick goaledge-logo.png -resize 48x48 assets/images/favicon.png
```

### 3. Verificar Arquivos
Confirme que os 4 arquivos foram criados:
- ✅ `assets/images/icon.png` (1024x1024)
- ✅ `assets/images/adaptive-icon.png` (1024x1024)
- ✅ `assets/images/splash.png` (1284x2778)
- ✅ `assets/images/favicon.png` (48x48)

### 4. Limpar Cache do Expo
```bash
# Limpar cache para forçar atualização dos ícones
npx expo start -c
```

---

## 🎨 Especificações da Logo GoalEdge

Com base na imagem fornecida:

- **Cores principais:**
  - Laranja: #FF6B00 (listras de velocidade)
  - Preto: #1A1A1A (texto e contorno)
  - Branco: #FFFFFF (texto "GOAL")
  - Cinza: #808080 (bola de futebol)

- **Elementos:**
  - Bola de futebol no topo
  - Listras de velocidade laranja
  - Texto "GOAL" em branco
  - Texto "EDGE" em laranja
  - Escudo/badge preto
  - Estrela laranja na base

- **Estilo:**
  - Esportivo e dinâmico
  - Alta energia (listras de movimento)
  - Profissional

---

## ✅ Checklist Final

Após substituir os arquivos:

- [ ] icon.png substituído (1024x1024)
- [ ] adaptive-icon.png substituído (1024x1024 com margem)
- [ ] splash.png substituído (1284x2778)
- [ ] favicon.png substituído (48x48)
- [ ] Cache do Expo limpo (`npx expo start -c`)
- [ ] App testado no simulador/dispositivo
- [ ] Ícone aparece corretamente na home screen
- [ ] Splash screen mostra a nova logo

---

## 🚀 Testar as Mudanças

### No Simulador/Emulador:
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### No Dispositivo Físico:
```bash
# Iniciar Expo
npx expo start

# Escanear QR code com Expo Go
```

**Importante:** Pode ser necessário desinstalar e reinstalar o app para ver as mudanças no ícone!

---

## 📱 Onde a Logo Aparece

Após a substituição, a nova logo GoalEdge aparecerá em:

1. **Ícone do App** (Home screen do celular)
2. **Tela de Splash** (Ao abrir o app)
3. **App Switcher** (Lista de apps abertos)
4. **Configurações do Sistema** (Lista de apps instalados)
5. **Play Store/App Store** (Quando publicar)
6. **Notificações** (Ícone pequeno)
7. **Versão Web** (Favicon no navegador)

---

## 🆘 Problemas Comuns

### Ícone não atualiza após substituir arquivos
**Solução:**
```bash
# Limpar cache
npx expo start -c

# Ou desinstalar e reinstalar o app
```

### Logo aparece cortada no Android
**Solução:**
- Verifique se o adaptive-icon.png tem margem de 20%
- A área segura é 820x820 dentro do canvas 1024x1024

### Splash screen não mostra a logo
**Solução:**
- Verifique se o splash.png tem fundo transparente
- O fundo #1A1A1A é aplicado automaticamente pelo app.json

### Favicon não aparece na web
**Solução:**
- Limpe o cache do navegador (Ctrl+Shift+Delete)
- Verifique se o favicon.png tem 48x48 pixels

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Tamanhos dos arquivos estão corretos
2. Formato PNG com transparência (exceto favicon)
3. Cache foi limpo
4. App foi reinstalado

---

**Última Atualização:** 5 de Maio de 2026  
**Versão:** 1.0
