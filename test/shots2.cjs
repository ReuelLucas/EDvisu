const { chromium } = require('playwright');
const OUT = '/home/claude/edvisu/shots';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await page.goto('http://localhost:4173/');
  const run = (fn) => page.getByRole('button', { name: fn, exact: true }).click();
  const until = async (re) => {
    for (let i = 0; i < 60; i++) {
      const txt = await page.locator('text=/PASSO \\d+ DE \\d+/').first().locator('xpath=..').innerText();
      if (re.test(txt)) return;
      await page.getByRole('button', { name: /Avançar/ }).click();
      await page.waitForTimeout(60);
    }
    throw new Error('step not found ' + re);
  };
  const settle = () => page.waitForTimeout(900);
  await settle();
  // zoom nos nós
  await page.screenshot({ path: `${OUT}/z1-nodes.png`, clip: { x: 80, y: 380, width: 560, height: 140 } });
  // ant declarado sem valor + painel de memória expandido + variável expandida
  await run('remover_final'); await until(/Elem\* ant: ant é declarado/); await settle();
  await page.getByText('Expandir ▾').click();
  await page.getByTitle('Ver a struct completa para onde o ponteiro aponta').nth(1).click();
  await settle();
  await page.screenshot({ path: `${OUT}/z2-uninit-memoria.png` });
  // criação de aux (born) - voltar um passo e avançar
  await page.getByRole('button', { name: /Voltar/ }).click(); await page.waitForTimeout(80);
  await page.getByRole('button', { name: /Avançar/ }).click(); await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/z3-born.png`, clip: { x: 16, y: 98, width: 700, height: 50 } });
  // fim: variáveis saindo de escopo
  await until(/return 0/); await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/z4-died.png` });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
