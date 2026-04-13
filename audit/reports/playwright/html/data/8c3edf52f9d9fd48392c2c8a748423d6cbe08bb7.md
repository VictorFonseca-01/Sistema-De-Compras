# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\aprovacao.spec.ts >> Fluxos de Aprovação e Gestão (Integração) >> deve carregar tela de auditoria técnica para TI
- Location: tests\e2e\integration\aprovacao.spec.ts:10:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/relatorios", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Fluxos de Aprovação e Gestão (Integração)', () => {
  4  |   test('deve acessar dashboard de gestão sem erros', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await expect(page).not.toHaveTitle(/Fatal/i);
  8  |   });
  9  | 
  10 |   test('deve carregar tela de auditoria técnica para TI', async ({ page }) => {
> 11 |     await page.goto('/relatorios');
     |                ^ Error: page.goto: Could not connect to server
  12 |     if (page.url().includes('login')) return; // Silencioso se cair no login (permissoes tratam disso)
  13 |     await expect(page.getByText(/Relatório de Compras|Inventory Management/i)).toBeVisible();
  14 |   });
  15 | 
  16 |   test('deve carregar seção de fechamento de compra', async ({ page }) => {
  17 |     await page.goto('/solicitacoes');
  18 |     if (page.url().includes('login')) return;
  19 |     await expect(page.getByRole('heading')).toBeVisible();
  20 |   });
  21 | });
  22 | 
```