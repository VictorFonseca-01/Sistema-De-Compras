# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\permissoes.spec.ts >> Controle de Permissões (Mocked) >> Solicitante não deve ver botões administrativos
- Location: tests\e2e\mocked\permissoes.spec.ts:4:3

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
  1  | import { test, expect } from '../fixtures/roles';
  2  | 
  3  | test.describe('Controle de Permissões (Mocked)', () => {
  4  |   test('Solicitante não deve ver botões administrativos', async ({ solicitantePage }) => {
  5  |     // Garantir que carregou
> 6  |     await expect(solicitantePage.getByRole('main')).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  7  |     
  8  |     // Botões de aprovação/configurações não devem ser visíveis para usuário comum no DOM
  9  |     const adminAction = solicitantePage.getByRole('button', { name: /AUTORIZAR|CONFIGURAR/i });
  10 |     await expect(adminAction).not.toBeVisible();
  11 |   });
  12 | 
  13 |   test('TI deve ver áreas técnicas mas não deve aprovar diretoria', async ({ tiPage }) => {
  14 |     await expect(tiPage.getByText(/Auditoria Técnica|TI/i)).toBeVisible();
  15 |     await expect(tiPage.getByRole('button', { name: /APROVAR DIRETORIA/i })).not.toBeVisible();
  16 |   });
  17 | 
  18 |   test('Diretoria não deve editar orçamentos', async ({ diretoriaPage }) => {
  19 |     // A diretoria aprova, mas não entra no mapa de cotação para editar valores
  20 |     const editQuote = diretoriaPage.getByRole('button', { name: /EDITAR ORÇAMENTO/i });
  21 |     await expect(editQuote).not.toBeVisible();
  22 |   });
  23 | });
  24 | 
```