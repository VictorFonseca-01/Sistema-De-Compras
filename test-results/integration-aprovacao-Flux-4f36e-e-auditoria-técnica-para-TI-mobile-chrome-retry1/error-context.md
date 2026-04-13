# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\aprovacao.spec.ts >> Fluxos de Aprovação e Gestão (Integração) >> deve carregar tela de auditoria técnica para TI
- Location: tests\e2e\integration\aprovacao.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Relatório de Compras|Inventory Management/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/Relatório de Compras|Inventory Management/i)

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
  2  | 
  3  | test.describe('Fluxos de Aprovação e Gestão (Integração)', () => {
  4  |   test('deve acessar dashboard de gestão sem erros', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await page.waitForLoadState('networkidle');
  7  |     await expect(page).not.toHaveTitle(/Fatal/i);
  8  |   });
  9  | 
  10 |   test('deve carregar tela de auditoria técnica para TI', async ({ page }) => {
  11 |     await page.goto('/relatorios');
  12 |     if (page.url().includes('login')) return; // Silencioso se cair no login (permissoes tratam disso)
> 13 |     await expect(page.getByText(/Relatório de Compras|Inventory Management/i)).toBeVisible();
     |                                                                                ^ Error: expect(locator).toBeVisible() failed
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