#!/bin/bash

# audit-local.sh - Auditoria Completa Local (Linux/macOS)
# Executar na raiz do projeto: ./scripts/audit-local.sh

echo "=================================================="
echo "INICIANDO AUDITORIA LOCAL (GLOBAL PARTS)"
echo "=================================================="

ROOT=$(pwd)
REPORTS_DIR="$ROOT/audit/reports"

# Garantir existência dos diretórios de relatórios
mkdir -p "$REPORTS_DIR/playwright" "$REPORTS_DIR/semgrep" "$REPORTS_DIR/gitleaks" "$REPORTS_DIR/zap"

# 1. Lint e Typecheck
if [ -f "$ROOT/package.json" ]; then
    echo "[1/5] Executando Análise Estática (Lint/TS)..."
    npm run lint
    
    if [ -f "$ROOT/node_modules/.bin/tsc" ]; then
       echo "  - Rodando Typecheck..."
       npx tsc --noEmit
    fi
fi

# 2. Playwright E2E
echo "[2/5] Executando Testes E2E (Playwright)..."
npx playwright test

# 3. Semgrep (Com Fallback)
echo "[3/5] Executando Varredura de Segurança (Semgrep)..."
if command -v semgrep &> /dev/null; then
    semgrep --config .semgrep.yml --json --output "$REPORTS_DIR/semgrep/results.json"
    echo "  - Semgrep concluído com sucesso."
elif python3 -m semgrep --version &> /dev/null; then
    python3 -m semgrep --config .semgrep.yml --json --output "$REPORTS_DIR/semgrep/results.json"
    echo "  - Semgrep concluído com sucesso (via Python3)."
else
    echo "  [AVISO] Semgrep não executado. Ferramenta não encontrada no PATH ou via Python3."
fi

# 4. Gitleaks
echo "[4/5] Verificando Segredos (Gitleaks)..."
if command -v gitleaks &> /dev/null; then
    gitleaks detect --report-format json --report-path "$REPORTS_DIR/gitleaks/results.json"
    echo "  - Gitleaks concluído com sucesso."
else
    echo "  [AVISO] Gitleaks não executado. Ferramenta não encontrada no PATH."
fi

# 5. Resumo
echo ""
echo "=================================================="
echo "AUDITORIA FINALIZADA!"
echo "Relatórios disponíveis em: $REPORTS_DIR"
echo "=================================================="
