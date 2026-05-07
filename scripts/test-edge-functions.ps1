# Script PowerShell para testar as Edge Functions do CornerEdge
# Uso: .\scripts\test-edge-functions.ps1 [generate|update|both]

param(
    [string]$Action = "both"
)

# Função para carregar .env
function Load-EnvFile {
    if (Test-Path .env) {
        Get-Content .env | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    } else {
        Write-Host "Erro: Arquivo .env não encontrado" -ForegroundColor Red
        exit 1
    }
}

# Carregar variáveis
Load-EnvFile

$SUPABASE_URL = $env:EXPO_PUBLIC_SUPABASE_URL
$ANON_KEY = $env:EXPO_PUBLIC_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $ANON_KEY) {
    Write-Host "Erro: Variáveis EXPO_PUBLIC_SUPABASE_URL ou EXPO_PUBLIC_SUPABASE_ANON_KEY não encontradas" -ForegroundColor Red
    exit 1
}

# Extrair project ref
$PROJECT_REF = $SUPABASE_URL -replace 'https://(.*)\.supabase\.co', '$1'
$BASE_URL = "https://$PROJECT_REF.supabase.co/functions/v1"

Write-Host "`n=== CornerEdge - Teste de Edge Functions ===" -ForegroundColor Yellow
Write-Host "Project: $PROJECT_REF"
Write-Host "Base URL: $BASE_URL`n"

# Função para testar geração
function Test-Generate {
    Write-Host "Testando: generate-daily-analyses" -ForegroundColor Yellow
    Write-Host "Endpoint: $BASE_URL/generate-daily-analyses`n"
    
    try {
        $headers = @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/generate-daily-analyses" `
            -Method Post `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "✓ Sucesso" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
    Write-Host ""
}

# Função para testar atualização
function Test-Update {
    Write-Host "Testando: update-results" -ForegroundColor Yellow
    Write-Host "Endpoint: $BASE_URL/update-results`n"
    
    try {
        $headers = @{
            "Authorization" = "Bearer $ANON_KEY"
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri "$BASE_URL/update-results" `
            -Method Post `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "✓ Sucesso" -ForegroundColor Green
        $response | ConvertTo-Json -Depth 10
    } catch {
        Write-Host "✗ Erro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
    }
    Write-Host ""
}

# Executar testes
switch ($Action.ToLower()) {
    "generate" {
        Test-Generate
    }
    "update" {
        Test-Update
    }
    "both" {
        Test-Generate
        Start-Sleep -Seconds 2
        Test-Update
    }
    default {
        Write-Host "Uso: .\scripts\test-edge-functions.ps1 [generate|update|both]`n"
        Write-Host "Opções:"
        Write-Host "  generate  - Testa apenas a geração de análises"
        Write-Host "  update    - Testa apenas a atualização de resultados"
        Write-Host "  both      - Testa ambas as funções (padrão)"
        exit 1
    }
}

Write-Host "=== Testes concluídos ===" -ForegroundColor Green
