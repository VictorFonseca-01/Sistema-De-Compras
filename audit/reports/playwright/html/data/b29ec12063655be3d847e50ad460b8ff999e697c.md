# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\permissoes.spec.ts >> Controle de Permissões (Mocked) >> TI deve ver áreas técnicas mas não deve aprovar diretoria
- Location: tests\e2e\mocked\permissoes.spec.ts:13:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | /* eslint-disable react-hooks/rules-of-hooks */
  2  | import { test as base, expect, Page } from '@playwright/test';
  3  | import { mockSupabaseSession } from '../helpers/auth';
  4  | 
  5  | type RolePages = {
  6  |   solicitantePage: Page;
  7  |   gestorPage: Page;
  8  |   tiPage: Page;
  9  |   comprasPage: Page;
  10 |   diretoriaPage: Page;
  11 | };
  12 | 
  13 | export const test = base.extend<RolePages>({
  14 |   solicitantePage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
  15 |     await mockSupabaseSession(page, 'usuario');
  16 |     await page.goto('/');
  17 |     await use(page);
  18 |   },
  19 |   gestorPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
  20 |     await mockSupabaseSession(page, 'gestor');
  21 |     await page.goto('/');
  22 |     await use(page);
  23 |   },
  24 |   tiPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
  25 |     await mockSupabaseSession(page, 'ti');
> 26 |     await page.goto('/');
     |                ^ Error: page.goto: Could not connect to server
  27 |     await use(page);
  28 |   },
  29 |   comprasPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
  30 |     await mockSupabaseSession(page, 'compras');
  31 |     await page.goto('/');
  32 |     await use(page);
  33 |   },
  34 |   diretoriaPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
  35 |     await mockSupabaseSession(page, 'diretoria');
  36 |     await page.goto('/');
  37 |     await use(page);
  38 |   },
  39 | });
  40 | 
  41 | export { expect };
  42 | 
```