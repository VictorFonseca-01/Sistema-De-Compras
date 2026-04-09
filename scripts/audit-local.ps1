# audit-local.ps1 - Auditoria Completa Local
# Executar na raiz do projeto: .\scripts\audit-local.ps1

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "INICIANDO AUDITORIA LOCAL (GLOBAL PARTS)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$root = Get-Location
$reportsDir = "$root\audit\reports"

# Garantir existência dos diretórios de relatórios
$dirs = @("playwright", "semgrep", "gitleaks", "zap")
foreach ($dir in $dirs) {
    if (!(Test-Path "$reportsDir\$dir")) {
        New-Item -ItemType Directory -Path "$reportsDir\$dir" -Force | Out-Null
    }
}

# 1. Lint e Typecheck (se configurado no package.json)
if (Test-Path "$root\package.json") {
    Write-Host "[1/5] Executando Análise Estática (Lint/TS)..." -ForegroundColor Gray
    npm run lint
    
    # Adicionar typecheck se typescript estiver presente
    if (Test-Path "$root\node_modules\.bin\tsc") {
       Write-Host "  - Rodando Typecheck..." -ForegroundColor Gray
       npx tsc --noEmit
    }
}

# 2. Playwright E2E
Write-Host "[2/5] Executando Testes E2E (Playwright)..." -ForegroundColor Gray
npx playwright test

# 3. Semgrep (Com Fallback)
Write-Host "[3/5] Executando Varredura de Segurança (Semgrep)..." -ForegroundColor Gray
$semgrepSuccess = $false
try {
    semgrep --config .semgrep.yml --json --output "$reportsDir\semgrep\results.json"
    $semgrepSuccess = $true
} catch {
    try {
        python -m semgrep --config .semgrep.yml --json --output "$reportsDir\semgrep\results.json"
        $semgrepSuccess = $true
    } catch {
        Write-Host "  [AVISO] Semgrep no executado. Ferramenta no encontrada no PATH ou via Python." -ForegroundColor Yellow
    }
}
if ($semgrepSuccess) { Write-Host "  - Semgrep concludo com sucesso." -ForegroundColor Green }

# 4. Gitleaks (Resiliente)
Write-Host "[4/5] Verificando Segredos (Gitleaks)..." -ForegroundColor Gray
try {
    gitleaks detect --report-format json --report-path "$reportsDir\gitleaks\results.json"
    Write-Host "  - Gitleaks concludo com sucesso." -ForegroundColor Green
} catch {
    Write-Host "  [AVISO] Gitleaks no executado. Ferramenta no encontrada no PATH." -ForegroundColor Yellow
}

# 5. Resumo
Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "AUDITORIA FINALIZADA!" -ForegroundColor Cyan
Write-Host "Relatrios disponveis em: $reportsDir" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
