import { expect, test } from '@playwright/test';
import { entrar, foto } from './ajuda';

/* Roteiro de ponta a ponta com os dados FICTÍCIOS de infra/ci/dados-de-teste.sql (rode-o após o supabase db reset). */

test.describe.configure({ mode: 'serial' });

test('site público: seções do protótipo e calendário de toques', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/fé, axé e tradição/i);
  for (const palavra of ['FÉ', 'TOQUES', 'FESTAS', 'JOGO DE BÚZIOS', 'ESTAMOS']) {
    await expect(page.locator('.bigword', { hasText: palavra }).first()).toBeVisible();
  }
  await foto(page, '01-site-inicio');

  await page.getByRole('link', { name: /calendário de toques/i }).click();
  await expect(page).toHaveURL(/\/agenda/);
  await page.goto('/agenda?mes=2026-11');
  await expect(page.locator('.calx-dia').getByText('Toque de Exu')).toBeVisible();
  await foto(page, '02-site-calendario-toques');
});

test('área restrita exige login', async ({ page }) => {
  await page.goto('/app/admin');
  await expect(page).toHaveURL(/\/entrar/);
  await foto(page, '03-entrar');
});

test('filho: escolhe o dia da limpeza e envia comprovante', async ({ page }) => {
  await entrar(page, 'filho1@exemplo.test');
  await expect(page.getByText(/Olá, Ana/)).toBeVisible();
  await foto(page, '04-filho-inicio');

  // filho não acessa o painel do admin
  await page.goto('/app/admin');
  await expect(page).toHaveURL(/\/app\/filho$/);

  await page.goto('/app/filho/escala');
  const comPrazo = page.locator('.card', { has: page.locator('select[name="dia"]') }).first();
  await comPrazo.locator('select[name="dia"]').selectOption({ index: 6 });
  await comPrazo.getByRole('button', { name: /Escolher o dia|Trocar dia/ }).click();
  await expect(page.getByText('Dia escolhido ✔')).toBeVisible();
  await foto(page, '05-filho-escala');

  await page.goto('/app/filho/calendario?mes=2026-11');
  await page.locator('.calx-cel', { hasText: /^12/ }).click();
  await expect(page.locator('.calx-dia').getByText('Preparação do barracão (exemplo)')).toBeVisible();
  await expect(page.getByText('Você está escalado(a)').first()).toBeVisible();
  await foto(page, '06-filho-calendario');

  await page.goto('/app/filho/mensalidade');
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'comprovante.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByRole('button', { name: /Enviar comprovante/ }).first().click();
  await expect(page.getByText('Comprovante enviado — em análise')).toBeVisible();
  await expect(page.getByText('em análise').first()).toBeVisible();
  await foto(page, '07-filho-mensalidade');

  // arquivo falso (texto com extensão .pdf) é recusado
  await page.goto('/app/filho/festas');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'falso.pdf', mimeType: 'application/pdf', buffer: Buffer.from('nao sou pdf') });
  await page.getByRole('button', { name: /Enviar comprovante/ }).first().click();
  await expect(page.getByText('O conteúdo do arquivo não corresponde à extensão.')).toBeVisible();

  await page.goto('/app/filho/meus-dados');
  await expect(page.getByText('somente leitura')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);
});

test('admin: confirma comprovante, controla caixa e calendário', async ({ page }) => {
  await entrar(page, 'admin@exemplo.test');
  await expect(page.getByText('Comprovantes para analisar')).toBeVisible();
  await foto(page, '08-admin-inicio');

  await page.goto('/app/admin/financeiro');
  const linha = page.locator('.item', { hasText: 'Ana Ribeiro (exemplo)' });
  await expect(linha.getByText('em análise')).toBeVisible();
  await linha.getByRole('button', { name: '✔ Confirmar' }).click();
  await expect(page.getByText('Pagamento confirmado ✔')).toBeVisible();
  await expect(page.locator('.item', { hasText: 'Ana Ribeiro (exemplo)' }).getByText('em dia')).toBeVisible();

  await page.getByText('+ Novo lançamento').click();
  await page.locator('select[name="tipo"]').selectOption('receita');
  await page.locator('input[name="valor"]').fill('120.50');
  await page.locator('input[name="descricao"]').fill('Doação (teste E2E)');
  await page.getByRole('button', { name: 'Salvar lançamento' }).click();
  await expect(page.getByText('Lançamento salvo ✔')).toBeVisible();
  await foto(page, '09-admin-financeiro');

  await page.goto('/app/admin/calendario?mes=2026-12');
  await page.getByText('+ Nova função / obrigação').click();
  await page.locator('input[name="titulo"]').first().fill('Oro de fim de ano (teste)');
  await page.locator('input[name="data"]').first().fill('2026-12-20');
  await page.getByRole('button', { name: 'Salvar função' }).click();
  await expect(page.getByText(/Função cadastrada/)).toBeVisible();
  await expect(page.locator('.pill', { hasText: 'Presença obrigatória de todos os filhos' })).toBeVisible();
  await page.locator('.calx-cel', { hasText: /^20/ }).click();
  await expect(page.locator('.calx-dia .tag', { hasText: 'Obrigação' })).toBeVisible();
  await foto(page, '10-admin-calendario');

  await page.goto('/app/aprender');
  await page.getByText('+ Publicar uma lição').click();
  await page.locator('select[name="categoria"]').selectOption('cantigas');
  await page.locator('input[name="titulo"]').fill('Cantiga de Oxóssi (teste)');
  await page.locator('textarea[name="conteudo"]').fill('Letra da cantiga (teste E2E)');
  await page.getByRole('button', { name: 'Publicar lição' }).click();
  await expect(page.getByText('Lição publicada ✔')).toBeVisible();

  await page.goto('/app/admin/rodizio');
  await expect(page.getByText(/Meta de limpezas no ano/)).toBeVisible();
  await foto(page, '11-admin-rodizio');

  await page.goto('/app/admin/filhos');
  await foto(page, '12-admin-filhos');
  await page.goto('/app/admin/auditoria');
  await expect(page.getByText('Confirmou pagamento').first()).toBeVisible();
});
