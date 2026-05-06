const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Plugin para corrigir a versão do Fresco no build.gradle
 * Substitui ${expoLibs.versions.fresco.get()} por versão fixa 3.1.3
 */
const withFixedFrescoVersion = (config) => {
  return withAppBuildGradle(config, (config) => {
    const { modResults } = config;
    
    // Substituir todas as ocorrências de ${expoLibs.versions.fresco.get()} por 3.1.3
    modResults.contents = modResults.contents.replace(
      /\$\{expoLibs\.versions\.fresco\.get\(\)\}/g,
      '3.1.3'
    );
    
    return config;
  });
};

module.exports = withFixedFrescoVersion;
