# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\solicitacao.spec.ts >> Solicitação (Integração) >> deve validar formulário de solicitação no frontend
- Location: tests\e2e\integration\solicitacao.spec.ts:20:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Solicitação (Integração)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Garantir que estamos na raiz
> 6  |     await page.goto('/');
     |                ^ Error: page.goto: Could not connect to server
  7  |     await page.waitForLoadState('networkidle');
  8  |   });
  9  | 
  10 |   test('deve navegar para nova solicitação sem erros fatais', async ({ page }) => {
  11 |     // Tenta encontrar link de nova solicitação
  12 |     const newReqBtn = page.getByRole('link', { name: /NOVA SOLICITAÇÃO|NOVO PEDIDO/i }).first();
  13 |     if (await newReqBtn.isVisible()) {
  14 |       await newReqBtn.click();
  15 |       await expect(page).not.toHaveTitle(/404|Error/i);
  16 |       await expect(page.getByRole('heading')).toBeVisible();
  17 |     }
  18 |   });
  19 | 
  20 |   test('deve validar formulário de solicitação no frontend', async ({ page }) => {
  21 |     await page.goto('/solicitacoes/nova');
  22 |     const submitBtn = page.getByRole('button', { name: /ENVIAR|CRIAR/i });
  23 |     if (await submitBtn.isVisible()) {
  24 |        await submitBtn.click();
  25 |        // Espera-se erros de validação se campos obrigatórios estiverem vazios
  26 |        await expect(page.getByText(/obrigatório|Erro/i)).toBeVisible();
  27 |     }
  28 |   });
  29 | });
  30 | 
```