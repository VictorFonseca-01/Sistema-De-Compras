# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\auth.spec.ts >> Autenticação (Componente) >> deve carregar a tela de login corretamente
- Location: tests\e2e\mocked\auth.spec.ts:8:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Autenticação (Componente)', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/login');
     |                ^ Error: page.goto: Could not connect to server
  6  |   });
  7  | 
  8  |   test('deve carregar a tela de login corretamente', async ({ page }) => {
  9  |     await expect(page).toHaveTitle(/Global Parts|Login/i);
  10 |     await expect(page.getByRole('heading', { name: /Autenticação/i })).toBeVisible();
  11 |   });
  12 | 
  13 |   test('deve validar e-mail corporativo', async ({ page }) => {
  14 |     const emailInput = page.getByPlaceholder(/USUARIO@GLOBALP.COM.BR/i);
  15 |     await emailInput.fill('teste@gmail.com');
  16 |     await page.getByRole('button', { name: /ENTRAR/i }).click();
  17 | 
  18 |     // Deve exibir erro de domínio se o formulário validar no submit
  19 |     await expect(page.getByText(/Uso exclusivo @globalp.com.br|Acesso restrito/i)).toBeVisible();
  20 |   });
  21 | });
  22 | 
```