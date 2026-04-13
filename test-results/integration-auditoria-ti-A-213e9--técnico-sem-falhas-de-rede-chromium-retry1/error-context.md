# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration\auditoria-ti.spec.ts >> Auditoria Técnica (Integração) >> deve carregar dashboard técnico sem falhas de rede
- Location: tests\e2e\integration\auditoria-ti.spec.ts:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/TI|Análise Técnica/i)
Expected: visible
Error: strict mode violation: getByText(/TI|Análise Técnica/i) resolved to 3 elements:
    1) <h1 class="text-2xl font-black text-gp-text tracking-tight uppercase">Autenticação</h1> aka getByRole('heading', { name: 'Autenticação' })
    2) <label class="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none">Identidade (Nome Completo)</label> aka getByText('Identidade (Nome Completo)')
    3) <label class="block text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 text-gp-muted ml-0.5 leading-none">E-mail Corporativo</label> aka getByText('E-mail Corporativo')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/TI|Análise Técnica/i)

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
  3  | test.describe('Auditoria Técnica (Integração)', () => {
  4  |   test('deve carregar dashboard técnico sem falhas de rede', async ({ page }) => {
  5  |     await page.goto('/relatorios');
  6  |     // Monitorar erros 500
  7  |     page.on('response', response => {
  8  |       if (response.status() >= 500) {
  9  |         throw new Error(`Erro de rede detectado: ${response.url()} status ${response.status()}`);
  10 |       }
  11 |     });
  12 |     
  13 |     // Se não cair no login, validar elementos de TI
  14 |     if (page.url().includes('relatorios')) {
> 15 |       await expect(page.getByText(/TI|Análise Técnica/i)).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  16 |     }
  17 |   });
  18 | });
  19 | 
```