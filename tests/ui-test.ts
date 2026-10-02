/**
 * Teste de UI do FUMIGA (navegador real) — cobre a aba TESTE e a entrada na colônia.
 *
 * Regras anti-flake (o motivo pelo qual este teste não usa `waitForTimeout`):
 *  1. Toda espera é por condição observável: seletor, texto ou evento de download.
 *  2. A aba TESTE vive no menu, onde o "mundo vivo" (simulação Phaser) não roda.
 *  3. No smoke de gameplay só se afirma o que é estável por construção: a seed
 *     fixa do Beta (731204), a presença do canvas e os rótulos do HUD — nunca
 *     contadores que o tempo da simulação altera.
 *
 * Uso: pnpm build && pnpm test:ui
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.env.FUMIGA_UI_PORT ?? 4173);
const BASE = `http://127.0.0.1:${PORT}/`;
const SHOT = path.join(ROOT, 'docs', 'screenshots', 'test-tab.png');
const GAMEPLAY_SHOT = path.join(ROOT, 'docs', 'screenshots', 'gameplay.png');
const EXPECTED_SEED = '731204';

type Check = { name: string; ok: boolean; detail?: string };
const checks: Check[] = [];
function check(name: string, ok: boolean, detail = ''): void {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} · ${name}${detail ? ` — ${detail}` : ''}`);
}

async function resolveExecutablePath(): Promise<string | undefined> {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  try {
    // Ambiente sem CDN de navegador: usa o Chromium empacotado para serverless.
    const sparticuz = (await import('@sparticuz/chromium')).default;
    return await sparticuz.executablePath();
  } catch {
    return undefined; // cai no Chromium instalado por `npx playwright install chromium`
  }
}

function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`servidor não subiu na porta ${port}`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

function ensureBuild(): void {
  if (fs.existsSync(path.join(ROOT, 'dist', 'public', 'index.html'))) return;
  console.log('dist/ ausente — rodando pnpm build…');
  const built = spawnSync('pnpm', ['build'], { cwd: ROOT, stdio: 'inherit' });
  if (built.status !== 0) throw new Error('pnpm build falhou; o teste de UI precisa do bundle');
}

function startPreview(): ChildProcess {
  const child = spawn('pnpm', ['preview', '--', '--host', '0.0.0.0', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    detached: true, // grupo próprio: o kill precisa derrubar o vite filho também
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk: Buffer) => process.stdout.write(`[preview] ${chunk.toString()}`));
  child.stderr?.on('data', (chunk: Buffer) => process.stdout.write(`[preview] ${chunk.toString()}`));
  return child;
}

function stopPreview(child: ChildProcess): void {
  if (child.pid === undefined) return;
  try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); }
}

async function main(): Promise<void> {
  ensureBuild();
  const preview = startPreview();
  try {
    await waitForPort(PORT, 60_000);
    const executablePath = await resolveExecutablePath();
    console.log(`chromium: ${executablePath ?? 'instalado pelo Playwright'}`);

    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
      const page = await context.newPage();
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });

      await page.goto(BASE, { waitUntil: 'load', timeout: 30_000 });
      await page.waitForSelector('[data-panel-root="main-menu"][data-ready="true"]', { timeout: 30_000 });
      check('menu principal sinaliza pronto (data-ready, sem sleep)', true);

      // ---- aba TESTE -------------------------------------------------------
      await page.click('[data-menu-item="test"]');
      const dialog = page.locator('[data-panel="test"]');
      await dialog.waitFor({ state: 'visible', timeout: 15_000 });
      check('aba TESTE abre a partir do menu', await dialog.isVisible());

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 20_000 }),
        page.click('[data-testid="test-export"]'),
      ]);
      const fileName = download.suggestedFilename();
      const filePath = await download.path();
      const fileContents = await fs.promises.readFile(filePath!, 'utf-8');
      const save = JSON.parse(fileContents) as { schema: string; schemaVersion: number; meta: { profileId: string; royalJelly: number }; records: unknown[] };

      check('exportação gera download .json', /^fumiga-save-.+\.json$/.test(fileName), fileName);
      check('JSON exportado usa o schema do beta', save.schema === 'fumiga-beta-save' && save.schemaVersion === 1, `${save.schema} v${save.schemaVersion}`);
      check('JSON exportado traz meta e records', Boolean(save.meta?.profileId) && Array.isArray(save.records), `profile=${save.meta?.profileId} records=${save.records.length}`);

      const previewText = (await page.locator('[data-testid="test-preview"]').textContent()) ?? '';
      check('pré-visualização da aba é idêntica ao arquivo baixado', previewText.trim() === fileContents.trim());
      await page.locator('[data-testid="test-status"]').filter({ hasText: 'Save exportado' }).waitFor({ timeout: 10_000 });
      check('aba reporta a exportação no status', true);

      // ---- importação ------------------------------------------------------
      const tampered = { ...save, meta: { ...save.meta, royalJelly: 77 } };
      const importPath = path.join(os.tmpdir(), `fumiga-import-${Date.now()}.json`);
      await fs.promises.writeFile(importPath, JSON.stringify(tampered, null, 2), 'utf-8');
      await page.setInputFiles('[data-testid="test-import"]', importPath);
      await page.locator('[data-testid="test-status"]').filter({ hasText: 'Save importado' }).waitFor({ timeout: 15_000 });
      const jellyAfterImport = await page.locator('[data-testid="test-jelly"]').textContent();
      check('importação aplica o save e atualiza a aba', jellyAfterImport === '77', `geleia=${jellyAfterImport}`);

      const rejected = JSON.stringify({ schema: 'outro-jogo', schemaVersion: 1 });
      const badPath = path.join(os.tmpdir(), `fumiga-bad-${Date.now()}.json`);
      await fs.promises.writeFile(badPath, rejected, 'utf-8');
      await page.setInputFiles('[data-testid="test-import"]', badPath);
      await page.locator('[data-testid="test-status"]').filter({ hasText: 'Importação recusada' }).waitFor({ timeout: 15_000 });
      check('importação recusa schema estranho sem corromper o save', (await page.locator('[data-testid="test-jelly"]').textContent()) === '77');

      // ---- reset -----------------------------------------------------------
      await page.click('[data-testid="test-reset"]');
      await page.locator('[data-testid="test-status"]').filter({ hasText: 'apagado' }).waitFor({ timeout: 15_000 });
      check('reset devolve a progressão ao padrão', (await page.locator('[data-testid="test-jelly"]').textContent()) === '0');

      // ---- captura da aba TESTE (arte do PLAYTEST.md) -----------------------
      const [shotDownload] = await Promise.all([
        page.waitForEvent('download', { timeout: 20_000 }),
        page.click('[data-testid="test-export"]'),
      ]);
      await shotDownload.path();
      await page.locator('[data-testid="test-status"]').filter({ hasText: 'Save exportado' }).waitFor({ timeout: 10_000 });
      fs.mkdirSync(path.dirname(SHOT), { recursive: true });
      await dialog.screenshot({ path: SHOT });
      check('captura da aba TESTE salva', fs.existsSync(SHOT) && fs.statSync(SHOT).size > 5_000, path.relative(ROOT, SHOT));

      // ---- smoke de gameplay (mundo vivo, sem depender de tempo) ------------
      await page.click('.menu-dialog-close');
      // O botão JOGAR tem animação contínua (fireflies/pulso); o clique é forçado
      // e a espera seguinte é pelo HUD, que é o que realmente importa aqui.
      await page.locator('[data-menu-item="play"]').click({ force: true });
      await page.waitForSelector('.beta-top-hud', { timeout: 45_000 });
      check('HUD da colônia monta ao iniciar a run', true);
      const logText = (await page.locator('.beta-log').textContent()) ?? '';
      check(`HUD expõe a seed fixa ${EXPECTED_SEED}`, logText.includes(`SEED ${EXPECTED_SEED}`), logText.replace(/\s+/g, ' ').trim());
      check('canvas Phaser montado', (await page.locator('.fumiga-canvas-host canvas').count()) === 1);
      const resources = (await page.locator('.beta-resource-strip').textContent()) ?? '';
      check('HUD expõe biomassa e geleia', /BIOMASSA/.test(resources) && /GELEIA/.test(resources), resources.replace(/\s+/g, ' ').trim());

      await page.screenshot({ path: GAMEPLAY_SHOT });
      check('captura de gameplay salva', fs.existsSync(GAMEPLAY_SHOT) && fs.statSync(GAMEPLAY_SHOT).size > 5_000, path.relative(ROOT, GAMEPLAY_SHOT));

      // Ruído conhecido deste checkout: as spritesheet PNG não estão no repositório
      // (vivem no storage do WebDev, ver ASSETS.md), então o Phaser reclama do
      // carregamento. Tudo o mais que aparecer como erro continua sendo falha.
      const KNOWN_NOISE = [/favicon/i, /Failed to process file/, /status of 404/];
      const fatal = pageErrors.filter((entry) => !KNOWN_NOISE.some((pattern) => pattern.test(entry)));
      check('sem erros de JavaScript na sessão', fatal.length === 0, fatal.slice(0, 3).join(' | '));
    } finally {
      await browser.close();
    }
  } finally {
    stopPreview(preview);
  }

  const failed = checks.filter((entry) => !entry.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} verificações passaram`);
  if (failed.length > 0) {
    console.log(`Falhas:\n${failed.map((entry) => ` - ${entry.name}${entry.detail ? ` (${entry.detail})` : ''}`).join('\n')}`);
  }
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error('teste de UI abortou:', error);
  process.exitCode = 1;
});
