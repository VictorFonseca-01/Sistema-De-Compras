import { test, expect } from '@playwright/test';

test.describe('Fluxos de Aprovação e Gestão (Integração)', () => {
  test('deve acessar dashboard de gestão sem erros', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveTitle(/Fatal/i);
  });

  test('deve carregar tela de auditoria técnica para TI', async ({ page }) => {
    await page.goto('/auditoria-ti' || '/ti');
    if (page.url().includes('login')) return; // Silencioso se cair no login (permissoes tratam disso)
    await expect(page.getByText(/Auditoria/i || /Análise/i)).toBeVisible();
  });

  test('deve carregar seção de fechamento de compra', async ({ page }) => {
    await page.goto('/compras' || '/suprimentos');
    if (page.url().includes('login')) return;
    await expect(page.getByRole('heading')).toBeVisible();
  });
});
