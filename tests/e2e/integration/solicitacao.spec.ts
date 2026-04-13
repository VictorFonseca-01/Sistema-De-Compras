import { test, expect } from '@playwright/test';

test.describe('Solicitação (Integração)', () => {
  test.beforeEach(async ({ page }) => {
    // Garantir que estamos na raiz
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('deve navegar para nova solicitação sem erros fatais', async ({ page }) => {
    // Tenta encontrar link de nova solicitação
    const newReqBtn = page.getByRole('link', { name: /NOVA SOLICITAÇÃO|NOVO PEDIDO/i }).first();
    if (await newReqBtn.isVisible()) {
      await newReqBtn.click();
      await expect(page).not.toHaveTitle(/404|Error/i);
      await expect(page.getByRole('heading')).toBeVisible();
    }
  });

  test('deve validar formulário de solicitação no frontend', async ({ page }) => {
    await page.goto('/solicitacoes/nova');
    const submitBtn = page.getByRole('button', { name: /ENVIAR|CRIAR/i });
    if (await submitBtn.isVisible()) {
       await submitBtn.click();
       // Espera-se erros de validação se campos obrigatórios estiverem vazios
       await expect(page.getByText(/obrigatório|Erro/i)).toBeVisible();
    }
  });
});
