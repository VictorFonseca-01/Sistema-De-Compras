import { test as base, expect } from '@playwright/test';
import { mockSupabaseSession } from '../helpers/auth';

type RolePages = {
  solicitantePage: any;
  gestorPage: any;
  tiPage: any;
  comprasPage: any;
  diretoriaPage: any;
};

export const test = base.extend<RolePages>({
  solicitantePage: async ({ page }, use) => {
    await mockSupabaseSession(page, 'usuario');
    await page.goto('/');
    await use(page);
  },
  gestorPage: async ({ page }, use) => {
    await mockSupabaseSession(page, 'gestor');
    await page.goto('/');
    await use(page);
  },
  tiPage: async ({ page }, use) => {
    await mockSupabaseSession(page, 'ti');
    await page.goto('/');
    await use(page);
  },
  comprasPage: async ({ page }, use) => {
    await mockSupabaseSession(page, 'compras');
    await page.goto('/');
    await use(page);
  },
  diretoriaPage: async ({ page }, use) => {
    await mockSupabaseSession(page, 'diretoria');
    await page.goto('/');
    await use(page);
  },
});

export { expect };
