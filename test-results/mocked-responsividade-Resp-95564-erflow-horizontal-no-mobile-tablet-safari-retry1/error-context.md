# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mocked\responsividade.spec.ts >> Responsividade e Layout >> deve evitar overflow horizontal no mobile
- Location: tests\e2e\mocked\responsividade.spec.ts:10:3

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockSupabaseSession } from '../helpers/auth';
  3  | 
  4  | test.describe('Responsividade e Layout', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await mockSupabaseSession(page, 'usuario');
> 7  |     await page.goto('/');
     |                ^ Error: page.goto: Could not connect to server
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
  23 |     await expect(page.getByRole('main')).toBeVisible();
  24 |   });
  25 | });
  26 | 
```