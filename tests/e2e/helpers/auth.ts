import { Page } from '@playwright/test';

/**
 * Helper para mockar sessão do Supabase garantindo independência de dados reais.
 */
export async function mockSupabaseSession(page: Page, role: string) {
  await page.route('**/auth/v1/session**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-token',
        token_type: 'bearer',
        expires_in: 3600,
        user: {
          id: 'mock-user-id',
          email: `${role}@globalp.com.br`,
          app_metadata: {},
          user_metadata: { full_name: `User ${role}` },
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      })
    });
  });

  await page.route('**/rest/v1/profiles**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'mock-user-id',
        full_name: `User ${role}`,
        role: role,
        department: 'Global',
        company_id: 'c1',
        department_id: 'd1'
      }])
    });
  });

  // Mock de requisições vazio por padrão para não travar o carregamento
  await page.route('**/rest/v1/requests**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}
