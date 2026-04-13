# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\auth.spec.ts >> Autenticação (Componente) >> deve validar e-mail corporativo
- Location: tests\e2e\mocked\auth.spec.ts:13:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Uso exclusivo @globalp.com.br|Acesso restrito/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Uso exclusivo @globalp.com.br|Acesso restrito/i)

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
            - textbox "DIGITE SEU NOME PARA VALIDAÇÃO" [active] [ref=e25]
        - generic [ref=e26]:
          - generic [ref=e27]: E-mail Corporativo
          - generic [ref=e28]:
            - img [ref=e30]
            - textbox "usuario@globalp.com.br" [ref=e33]: teste@gmail.com
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
  2  | 
  3  | test.describe('Autenticação (Componente)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
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
> 19 |     await expect(page.getByText(/Uso exclusivo @globalp.com.br|Acesso restrito/i)).toBeVisible();
     |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  20 |   });
  21 | });
  22 | 
```