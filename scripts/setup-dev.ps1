# setup-dev.ps1 - Ambiente de Desenvolvimento e Auditoria
# Executar na raiz do projeto: .\scripts\setup-dev.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "INICIANDO CONFIGURAÇÃO DO AMBIENTE (SISTEMA DE COMPRAS)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$root = Get-Location

# 1. Dependências NPM
if (Test-Path "$root\package.json") {
    Write-Host "[1/4] Instalando dependências NPM..." -ForegroundColor Gray
    npm install
}

# 2. Playwright
Write-Host "[2/4] Instalando Playwright e Navegadores..." -ForegroundColor Gray
npx playwright install --with-deps

# 3. Verificação de Ferramentas de Auditoria
Write-Host "[3/4] Verificando Ferramentas de Auditoria..." -ForegroundColor Gray

# Semgrep
try {
    semgrep --version | Out-Null
    Write-Host "  - Semgrep: OK (Global)" -ForegroundColor Green
} catch {
    try {
        python -m semgrep --version | Out-Null
        Write-Host "  - Semgrep: OK (via Python Module)" -ForegroundColor Green
    } catch {
        Write-Host "  - Semgrep: NÃO ENCONTRADO. Recomenda-se: 'pip install semgrep' ou 'brew install semgrep'" -ForegroundColor Yellow
    }
}

# Gitleaks
try {
    gitleaks version | Out-Null
    Write-Host "  - Gitleaks: OK" -ForegroundColor Green
} catch {
    Write-Host "  - Gitleaks: NÃO ENCONTRADO. Recomenda-se: 'brew install gitleaks' ou download manual." -ForegroundColor Yellow
}

# 4. Estrutura de Pastas
Write-Host "[4/4] Finalizando estrutura..." -ForegroundColor Gray
$dirs = @("audit/reports/playwright", "audit/reports/semgrep", "audit/reports/gitleaks", "audit/reports/zap", "tests/e2e/data")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "Para rodar a auditoria, execute: .\scripts\audit-local.ps1" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
