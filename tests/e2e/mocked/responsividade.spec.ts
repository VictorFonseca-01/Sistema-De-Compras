import { test, expect } from '@playwright/test';
import { mockSupabaseSession } from '../helpers/auth';

test.describe('Responsividade e Layout', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabaseSession(page, 'usuario');
    await page.goto('/');
  });

  test('deve evitar overflow horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 13
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test('deve manter elementos principais visíveis no tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
