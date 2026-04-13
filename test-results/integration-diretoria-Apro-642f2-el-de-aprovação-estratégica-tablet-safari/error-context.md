# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\diretoria.spec.ts >> Aprovação Diretoria (Integração) >> deve acessar o painel de aprovação estratégica
- Location: tests\e2e\integration\diretoria.spec.ts:4:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/admin", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Aprovação Diretoria (Integração)', () => {
  4  |   test('deve acessar o painel de aprovação estratégica', async ({ page }) => {
> 5  |     await page.goto('/admin');
     |                ^ Error: page.goto: Could not connect to server
  6  |     
  7  |     // Se redirecionar para login não é erro, é proteção.
  8  |     // Mas se carregar, deve ter os elementos de decisão.
  9  |     if (page.url().includes('admin')) {
  10 |        await expect(page.getByText(/Diretoria|Aprovação/i)).toBeVisible();
  11 |     }
  12 |   });
  13 | });
  14 | 
```