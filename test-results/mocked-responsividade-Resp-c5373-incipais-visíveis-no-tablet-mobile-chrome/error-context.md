# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\responsividade.spec.ts >> Responsividade e Layout >> deve manter elementos principais visíveis no tablet
- Location: tests\e2e\mocked\responsividade.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('main')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('main')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - img "Global Parts" [ref=e8]
      - generic [ref=e9]:
        - heading "Autenticação" [level=1] [ref=e10]
        - paragraph [ref=e13]: Sistema de Compras
    - generic [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Identidade (Nome Completo)
          - generic [ref=e20]:
            - img [ref=e22]
            - textbox "DIGITE SEU NOME PARA VALIDAÇÃO" [ref=e25]
        - generic [ref=e26]:
          - generic [ref=e27]: E-mail Corporativo
          - generic [ref=e28]:
            - img [ref=e30]
            - textbox "usuario@globalp.com.br" [ref=e33]
        - generic [ref=e34]:
          - generic [ref=e35]: Senha de Acesso
          - generic [ref=e36]:
            - img [ref=e38]
            - textbox "••••••••" [ref=e41]
      - generic [ref=e42]:
        - button "ENTRAR NO AMBIENTE" [ref=e43]:
          - text: ENTRAR NO AMBIENTE
          - img [ref=e44]
        - generic [ref=e46]:
          - img [ref=e47]
          - generic [ref=e50]: Conexão Protegida pela Global Parts Inc.
      - paragraph [ref=e52]:
        - text: NOVO NA PLATAFORMA?
        - link "SOLICITAR CADASTRO" [ref=e53] [cursor=pointer]:
          - /url: /cadastro
  - paragraph [ref=e54]: © 2026 GLOBAL PARTS • SUPPLY CHAIN INTELLIGENCE
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockSupabaseSession } from '../helpers/auth';
  3  | 
  4  | test.describe('Responsividade e Layout', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await mockSupabaseSession(page, 'usuario');
  7  |     await page.goto('/');
  8  |   });
  9  | 
  10 |   test('deve evitar overflow horizontal no mobile', async ({ page }) => {
  11 |     await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
  12 |     await page.waitForLoadState('networkidle');
  13 | 
  14 |     const overflow = await page.evaluate(() => {
  15 |       return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  16 |     });
  17 |     expect(overflow).toBe(false);
  18 |   });
  19 | 
  20 |   test('deve manter elementos principais visíveis no tablet', async ({ page }) => {
  21 |     await page.setViewportSize({ width: 768, height: 1024 }); // iPad
  22 |     await page.waitForLoadState('networkidle');
> 23 |     await expect(page.getByRole('main')).toBeVisible();
     |                                          ^ Error: expect(locator).toBeVisible() failed
  24 |   });
  25 | });
  26 | 
```