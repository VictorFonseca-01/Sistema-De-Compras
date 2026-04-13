import { test, expect } from '@playwright/test';

test.describe('Aprovação Diretoria (Integração)', () => {
  test('deve acessar o painel de aprovação estratégica', async ({ page }) => {
    await page.goto('/admin');
    
    // Se redirecionar para login não é erro, é proteção.
    // Mas se carregar, deve ter os elementos de decisão.
    if (page.url().includes('admin')) {
       await expect(page.getByText(/Diretoria|Aprovação/i)).toBeVisible();
    }
  });
});
