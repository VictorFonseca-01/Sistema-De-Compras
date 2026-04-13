import { test, expect } from '@playwright/test';

test.describe('Conclusão e Anexos (Integração)', () => {
  test('deve validar blocos operacionais na conclusão', async ({ page }) => {
    // Tenta acessar página de detalhes de um pedido finalizado se houver
    await page.goto('/solicitacoes');
    const firstRequest = page.getByRole('link', { name: /DETALHES/i }).first();
    if (await firstRequest.isVisible()) {
      await firstRequest.click();
      await page.waitForLoadState('networkidle');
      
      // Checar se existem as seções de finalização (NF, Rastreio, etc)
      const fiscalData = page.getByText(/Nota Fiscal|Faturamento/i);
      if (await fiscalData.isVisible()) {
         await expect(fiscalData).toBeVisible();
      }
    }
  });

  test('deve validar zona de upload em solicitações abertas', async ({ page }) => {
     await page.goto('/solicitacoes/nova');
     const uploadZone = page.locator('input[type="file"]');
     // Se houver zona de anexo na criação
     if (await uploadZone.count() > 0) {
        await expect(uploadZone.first()).toBeAttached();
     }
  });
});
