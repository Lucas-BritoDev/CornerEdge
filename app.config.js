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
      
      // Variáveis de ambiente disponíveis via Constants.expoConfig.extra
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      apiFootballKey: process.env.APIFOOTBALL_KEY || "",
      
      // Flags de feature
      enableAdMob: true,
      enableAnalytics: false,
      
      // Configurações
      defaultLanguage: "pt",
      defaultTheme: "dark"
    }
  }
};
