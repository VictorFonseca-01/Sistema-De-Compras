import { test, expect } from '@playwright/test';

test.describe('Autenticação (Componente)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('deve carregar a tela de login corretamente', async ({ page }) => {
    await expect(page).toHaveTitle(/Global Parts/i || /Login/i);
    await expect(page.getByRole('heading', { name: /Autenticação/i })).toBeVisible();
  });

  test('deve validar e-mail corporativo', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/USUARIO@GLOBALP.COM.BR/i);
    await emailInput.fill('teste@gmail.com');
    await page.getByRole('button', { name: /ENTRAR/i }).click();

    // Deve exibir erro de domínio se o formulário validar no submit
    await expect(page.getByText(/Uso exclusivo @globalp.com.br/i || /Acesso restrito/i)).toBeVisible();
  });
});
