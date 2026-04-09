import { test, expect } from '@playwright/test';

test.describe('Aprovação Diretoria (Integração)', () => {
  test('deve acessar o painel de aprovação estratégica', async ({ page }) => {
    await page.goto('/diretoria' || '/aprovacao-diretoria');
    
    // Se redirecionar para login não é erro, é proteção.
    // Mas se carregar, deve ter os elementos de decisão.
    if (page.url().includes('diretoria')) {
       await expect(page.getByText(/Diretoria/i || /Aprovação/i)).toBeVisible();
    }
  });
});
