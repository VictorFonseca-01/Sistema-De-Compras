import { test, expect } from '../fixtures/roles';

test.describe('Controle de Permissões (Mocked)', () => {
  test('Solicitante não deve ver botões administrativos', async ({ solicitantePage }) => {
    // Garantir que carregou
    await expect(solicitantePage.getByRole('main')).toBeVisible();
    
    // Botões de aprovação/configurações não devem ser visíveis para usuário comum no DOM
    const adminAction = solicitantePage.getByRole('button', { name: /AUTORIZAR|CONFIGURAR/i });
    await expect(adminAction).not.toBeVisible();
  });

  test('TI deve ver áreas técnicas mas não deve aprovar diretoria', async ({ tiPage }) => {
    await expect(tiPage.getByText(/Auditoria Técnica/i || /TI/i)).toBeVisible();
    await expect(tiPage.getByRole('button', { name: /APROVAR DIRETORIA/i })).not.toBeVisible();
  });

  test('Diretoria não deve editar orçamentos', async ({ diretoriaPage }) => {
    // A diretoria aprova, mas não entra no mapa de cotação para editar valores
    const editQuote = diretoriaPage.getByRole('button', { name: /EDITAR ORÇAMENTO/i });
    await expect(editQuote).not.toBeVisible();
  });
});
