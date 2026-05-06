// ============================================================================
// GoalEdge - App Configuration
// ============================================================================
// Este arquivo substitui app.json e permite usar variáveis de ambiente
// no build de produção
// ============================================================================

export default {
  expo: {
    name: "GoalEdge",
    slug: "goaledge",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "goaledge",
    userInterfaceStyle: "automatic",
    
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1A1A1A"
    },
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.goaledge.app"
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#1A1A1A"
      },
      package: "com.goaledge.app"
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
      "expo-web-browser"
      // Removido: "./plugins/withFixedFrescoVersion" (pode causar problemas)
    ],
    
    experiments: {
      typedRoutes: true
    },
    
    extra: {
      router: {},
      
      eas: {
        projectId: "0d9fcdf1-3bbb-416e-bb66-07b3643e99a8"
      },
      
      // ✅ CORREÇÃO: Hardcode direto para funcionar no APK
      // Anon key do Supabase é PÚBLICA e segura para exposição
      // RLS (Row Level Security) protege os dados
      supabaseUrl: "https://pgglewzdzqbisidecndz.supabase.co",
      supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2xld3pkenFiaXNpZGVjbmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDU2NjMsImV4cCI6MjA5MzUyMTY2M30.gClPrFqBuQAU_syF6RFLk1C7U44atwOunU8p6SiFr7w",
      apiFootballKey: "1a896aad078a4eec7ab7121281bcd5ec",
      
      // Flags de feature
      enableAdMob: true,
      enableAnalytics: false,
      
      // Configurações
      defaultLanguage: "pt",
      defaultTheme: "dark"
    }
  }
};
