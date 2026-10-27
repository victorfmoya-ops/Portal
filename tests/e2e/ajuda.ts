import { expect, type Page } from '@playwright/test';

export const SENHA_DEMO = 'Axe2026demo';
const PASTA_TELAS = process.env.E2E_TELAS || '';

/** Captura a tela para a documentação (só quando E2E_TELAS aponta para uma pasta). */
export async function foto(page: Page, nome: string) {
  if (PASTA_TELAS) await page.screenshot({ path: `${PASTA_TELAS}/${nome}.png`, fullPage: true });
}

export async function entrar(page: Page, email: string) {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(SENHA_DEMO);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  // 1º acesso pede o termo de consentimento
  await page.waitForURL(/\/(consentimento|app\/(admin|filho))/, { timeout: 15000 });
  if (page.url().includes('/consentimento')) {
    await foto(page, '00-termo-consentimento');
    await page.getByRole('button', { name: 'Li e aceito' }).click();
  }
  await expect(page).toHaveURL(/\/app\/(admin|filho)/);
}

export async function sair(page: Page) {
  await page.context().clearCookies();
}
