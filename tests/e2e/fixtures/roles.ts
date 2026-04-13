import { test as base, expect, Page } from '@playwright/test';
import { mockSupabaseSession } from '../helpers/auth';

type RolePages = {
  solicitantePage: Page;
  gestorPage: Page;
  tiPage: Page;
  comprasPage: Page;
  diretoriaPage: Page;
};

export const test = base.extend<RolePages>({
  solicitantePage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    await mockSupabaseSession(page, 'usuario');
    await page.goto('/');
    await use(page);
  },
  gestorPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    await mockSupabaseSession(page, 'gestor');
    await page.goto('/');
    await use(page);
  },
  tiPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    await mockSupabaseSession(page, 'ti');
    await page.goto('/');
    await use(page);
  },
  comprasPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    await mockSupabaseSession(page, 'compras');
    await page.goto('/');
    await use(page);
  },
  diretoriaPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    await mockSupabaseSession(page, 'diretoria');
    await page.goto('/');
    await use(page);
  },
});

export { expect };
