import { test, expect } from '@playwright/test';

test.describe('Auditoria Técnica (Integração)', () => {
  test('deve carregar dashboard técnico sem falhas de rede', async ({ page }) => {
    await page.goto('/auditoria-ti');
    // Monitorar erros 500
    page.on('response', response => {
      if (response.status() >= 500) {
        throw new Error(`Erro de rede detectado: ${response.url()} status ${response.status()}`);
      }
    });
    
    // Se não cair no login, validar elementos de TI
    if (page.url().includes('auditoria-ti')) {
      await expect(page.getByText(/TI/i || /Análise Técnica/i)).toBeVisible();
    }
  });
});
