#!/bin/bash

# Script para testar as Edge Functions do CornerEdge
# Uso: ./scripts/test-edge-functions.sh [generate|update|both]

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Carregar variáveis do .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}Erro: Arquivo .env não encontrado${NC}"
    exit 1
fi

# Extrair project ref da URL do Supabase
PROJECT_REF=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/https:\/\/\(.*\)\.supabase\.co/\1/')
BASE_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

echo -e "${YELLOW}=== CornerEdge - Teste de Edge Functions ===${NC}\n"
echo "Project: $PROJECT_REF"
echo "Base URL: $BASE_URL"
echo ""

# Função para testar geração de análises
test_generate() {
    echo -e "${YELLOW}Testando: generate-daily-analyses${NC}"
    echo "Endpoint: $BASE_URL/generate-daily-analyses"
    echo ""
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/generate-daily-analyses" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Sucesso (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | jq '.'
    else
        echo -e "${RED}✗ Erro (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
    echo ""
}

# Função para testar atualização de resultados
test_update() {
    echo -e "${YELLOW}Testando: update-results${NC}"
    echo "Endpoint: $BASE_URL/update-results"
    echo ""
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        "$BASE_URL/update-results" \
        -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓ Sucesso (HTTP $HTTP_CODE)${NC}"
        echo "$BODY" | jq '.'
    else
        echo -e "${RED}✗ Erro (HTTP $HTTP_CODE)${NC}"
        echo "$BODY"
    fi
    echo ""
}

# Verificar se jq está instalado
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Aviso: jq não está instalado. Instale para melhor formatação do JSON.${NC}"
    echo ""
fi

# Executar testes baseado no argumento
case "$1" in
    generate)
        test_generate
        ;;
    update)
        test_update
        ;;
    both|"")
        test_generate
        sleep 2
        test_update
        ;;
    *)
        echo "Uso: $0 [generate|update|both]"
        echo ""
        echo "Opções:"
        echo "  generate  - Testa apenas a geração de análises"
        echo "  update    - Testa apenas a atualização de resultados"
        echo "  both      - Testa ambas as funções (padrão)"
        exit 1
        ;;
esac

echo -e "${GREEN}=== Testes concluídos ===${NC}"
