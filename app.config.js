// ============================================================================
// CornerEdge - App Configuration
// ============================================================================
// Este arquivo substitui app.json e permite usar variáveis de ambiente
// no build de produção
// ============================================================================

export default {
  expo: {
    name: "CornerEdge",
    slug: "corneredge",
    owner: "luck1993",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "corneredge",
    userInterfaceStyle: "automatic",
    
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1A1A1A"
    },
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.corneredge.app",
      buildNumber: "2"
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1A1A1A"
      },
      package: "com.corneredge.app",
      versionCode: 2
      // Usar Hermes (padrão e recomendado)
      // jsEngine: "hermes"
    },
    
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    
    plugins: [
      "expo-router",
      "expo-web-browser",
      // ✅ AdMob Plugin - Configuração oficial seguindo documentação
      // Docs: https://github.com/invertase/react-native-google-mobile-ads
      [
        "react-native-google-mobile-ads",
        {
          // Application IDs de PRODUÇÃO
          "androidAppId": "ca-app-pub-8609967398609187~6517332149",
          "iosAppId": "ca-app-pub-8609967398609187~6517332149",
          // Descrição para App Tracking Transparency (iOS)
          "userTrackingUsageDescription": "Este identificador será usado para fornecer anúncios personalizados para você.",
          // Atrasar inicialização de medição de app para evitar crash prematuro/compliance
          "delayAppMeasurementInit": true
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }",
            "minSdkVersion": 24,
            "compileSdkVersion": 35,
            "targetSdkVersion": 35,
            "buildToolsVersion": "35.0.0"
          },
          "ios": {
            "deploymentTarget": "15.1"
          }
        }
      ]
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    extra: {
      router: {},
      
      eas: {
        projectId: "a33a3f9c-daff-442c-9114-0b94c624c645"
      },
      
      // ✅ Credenciais do projeto CornerEdge (Supabase)
      // Anon key do Supabase é PÚBLICA e segura para exposição
      // RLS (Row Level Security) protege os dados
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://ehpvnayomnueqhtyuabm.supabase.co",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocHZuYXlvbW51ZXFodHl1YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDg4NDcsImV4cCI6MjA5MzY4NDg0N30.1IcxyRj8tdDuKxkYgdJi2ou7_2DNEdIix8TCaAnPp9Q",
      apiFootballKey: process.env.EXPO_PUBLIC_API || "1a896aad078a4eec7ab7121281bcd5ec",
      
      // Flags de feature
      enableAdMob: true,
      enableAnalytics: false,
      
      // Configurações
      defaultLanguage: "pt",
      defaultTheme: "dark"
    }
  }
};
