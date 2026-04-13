# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\conclusao.spec.ts >> Conclusão e Anexos (Integração) >> deve validar zona de upload em solicitações abertas
- Location: tests\e2e\integration\conclusao.spec.ts:20:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/solicitacoes/nova", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Conclusão e Anexos (Integração)', () => {
  4  |   test('deve validar blocos operacionais na conclusão', async ({ page }) => {
  5  |     // Tenta acessar página de detalhes de um pedido finalizado se houver
  6  |     await page.goto('/solicitacoes');
  7  |     const firstRequest = page.getByRole('link', { name: /DETALHES/i }).first();
  8  |     if (await firstRequest.isVisible()) {
  9  |       await firstRequest.click();
  10 |       await page.waitForLoadState('networkidle');
  11 |       
  12 |       // Checar se existem as seções de finalização (NF, Rastreio, etc)
  13 |       const fiscalData = page.getByText(/Nota Fiscal|Faturamento/i);
  14 |       if (await fiscalData.isVisible()) {
  15 |          await expect(fiscalData).toBeVisible();
  16 |       }
  17 |     }
  18 |   });
  19 | 
  20 |   test('deve validar zona de upload em solicitações abertas', async ({ page }) => {
> 21 |      await page.goto('/solicitacoes/nova');
     |                 ^ Error: page.goto: Could not connect to server
  22 |      const uploadZone = page.locator('input[type="file"]');
  23 |      // Se houver zona de anexo na criação
  24 |      if (await uploadZone.count() > 0) {
  25 |         await expect(uploadZone.first()).toBeAttached();
  26 |      }
  27 |   });
  28 | });
  29 | 
```