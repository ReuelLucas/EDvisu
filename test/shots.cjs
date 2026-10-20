const { chromium } = require('playwright');
const OUT = '/home/claude/edvisu/shots';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto('http://localhost:4173/');
  const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
  const pick = (label) => page.getByRole('button', { name: label, exact: true }).click();
  const run = (fn) => page.getByRole('button', { name: fn, exact: true }).click();
  const until = async (re) => {
    for (let i = 0; i < 60; i++) {
      const txt = await page.locator('text=/PASSO \\d+ DE \\d+/').first().locator('xpath=..').innerText();
      if (re.test(txt)) return;
      await page.getByRole('button', { name: /Avançar/ }).click();
      await page.waitForTimeout(80);
    }
    throw new Error('step not found ' + re);
  };
  const settle = () => page.waitForTimeout(900);

  const plan = process.argv[2] || 'all';
  await settle();
  await shot('01-lista-idle');

  await run('remover_final'); await until(/free\(aux\)/); await settle(); await shot('02-lista-free');
  await page.getByRole('button', { name: /Avançar/ }).click(); await settle(); await shot('03-lista-free-depois');

  await pick('Lista dupla'); await settle(); await shot('04-dupla-idle');
  await run('inserir_inicio'); await until(/antinicio|li->inicio->ant = no/); await settle(); await shot('05-dupla-ant');
  await run('remover_inicio'); await until(/free\(no\)/); await settle(); await shot('06-dupla-free');

  await pick('Lista circular'); await settle(); await shot('07-circ-idle');
  await run('inserir_final'); await until(/li->final->prox = no/); await settle(); await shot('08-circ-link');

  await pick('Pilha'); await settle(); await shot('09-pilha-idle');
  await run('pop'); await until(/free\(aux\)/); await settle(); await shot('10-pilha-free');

  await pick('Fila'); await settle(); await shot('11-fila-idle');
  await run('enqueue'); await until(/f->final->prox = no/); await settle(); await shot('12-fila-link');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
