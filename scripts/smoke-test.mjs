/**
 * Rauchtest der gebauten App.
 *
 * Startet einen Browser, klickt die wichtigsten Wege durch und legt
 * Bildschirmfotos ab. Vorher `npm run build` und `npx vite preview` ausführen.
 *
 * Umgebungsvariablen: SMOKE_BASE_URL, SMOKE_OUT, CHROMIUM_PATH
 */
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4173';
const out = process.env.SMOKE_OUT ?? 'screenshots';
mkdirSync(out, { recursive: true });
const launchOptions = { args: ['--no-sandbox'] };
if (process.env.CHROMIUM_PATH) launchOptions.executablePath = process.env.CHROMIUM_PATH;
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'de-DE' });
const page = await context.newPage();

const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));

const step = async (name, fn) => {
  try { await fn(); console.log(`✓ ${name}`); }
  catch (e) { console.log(`✗ ${name}: ${e.message}`); }
};

await step('Startseite lädt', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
  console.log('   Titel:', await page.textContent('h1'));
  await page.screenshot({ path: `${out}/01-start.png` });
});

await step('Ethanol analysieren', async () => {
  await page.click('button.chip:has-text("Ethanol")');
  await page.waitForSelector('.structure svg', { timeout: 15000 });
  await page.waitForSelector('.reaction-card', { timeout: 15000 });
  const groups = await page.$$eval('.card .chip', (els) => els.map((e) => e.textContent.trim()));
  console.log('   Gruppen:', groups.slice(0, 6).join(', '));
  const cards = await page.$$eval('.reaction-card h3', (els) => els.map((e) => e.textContent));
  console.log(`   ${cards.length} Vorschläge:`, cards.slice(0, 4).join(' | '));
  await page.screenshot({ path: `${out}/02-stoff.png`, fullPage: true });
});

await step('Funktionelle Gruppe hervorheben', async () => {
  await page.click('.chip:has-text("primärer Alkohol")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/03-highlight.png` });
});

await step('Reaktion öffnen', async () => {
  await page.click('.reaction-card >> nth=0');
  await page.waitForSelector('.tabs');
  console.log('   Reaktion:', await page.textContent('h1'));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/04-reaktion.png`, fullPage: true });
});

await step('Anleitung anzeigen', async () => {
  await page.click('.tab:has-text("Anleitung")');
  await page.waitForSelector('.procedure-step');
  const steps = await page.$$('.procedure-step');
  console.log(`   ${steps.length} Arbeitsschritte`);
  await page.screenshot({ path: `${out}/05-anleitung.png`, fullPage: true });
});

await step('Mechanismus anzeigen', async () => {
  await page.click('.tab:has-text("Mechanismus")');
  await page.waitForSelector('.mechanism-step');
  const steps = await page.$$('.mechanism-step');
  const hasProfile = await page.$('.energy-profile svg');
  console.log(`   ${steps.length} Mechanismusschritte, Energieprofil: ${hasProfile ? 'ja' : 'nein'}`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/06-mechanismus.png`, fullPage: true });
});

await step('Reaktionssuche', async () => {
  await page.goto(`${BASE}/#/suche`, { waitUntil: 'networkidle' });
  await page.fill('input[type="search"]', 'Elektrolyse');
  await page.waitForTimeout(300);
  const hits = await page.$$('.reaction-card');
  console.log(`   ${hits.length} Treffer für "Elektrolyse"`);
  await page.screenshot({ path: `${out}/07-suche.png`, fullPage: true });
});

await step('Elektrochemie', async () => {
  await page.goto(`${BASE}/#/elektrochemie`, { waitUntil: 'networkidle' });
  await page.waitForSelector('table.data');
  await page.click('.tab:has-text("Galvanische Zelle")');
  await page.waitForTimeout(300);
  const text = await page.textContent('.card');
  console.log('   Zellspannung berechnet:', /\d,\d{3} V|\d\.\d{3} V/.test(text) ? 'ja' : 'siehe Screenshot');
  await page.screenshot({ path: `${out}/08-elektrochemie.png`, fullPage: true });
});

await step('Werkzeuge: Gleichung ausgleichen', async () => {
  await page.goto(`${BASE}/#/werkzeuge`, { waitUntil: 'networkidle' });
  await page.fill('input[aria-label="Reaktionsgleichung"]', 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O');
  await page.waitForTimeout(400);
  console.log('   Ergebnis:', (await page.textContent('.equation-text')).trim());
  await page.screenshot({ path: `${out}/09-werkzeuge.png`, fullPage: true });
});

await step('Redoxwerkzeug', async () => {
  await page.click('.tab:has-text("Redoxgleichungen")');
  await page.waitForTimeout(400);
  const equations = await page.$$eval('.equation-text', (els) => els.map((e) => e.textContent.trim()));
  equations.forEach((eq) => console.log('   ', eq));
  await page.screenshot({ path: `${out}/10-redox.png`, fullPage: true });
});

await step('Dunkles Design', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('.icon-button');
  await page.waitForTimeout(300);
  await page.goto(`${BASE}/#/stoff?name=Aceton&smiles=CC(C)%3DO&formel=C3H6O`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.structure svg', { timeout: 15000 });
  await page.screenshot({ path: `${out}/11-dunkel.png`, fullPage: true });
});

await step('iPad-Ansicht', async () => {
  const ipad = await context.newPage();
  await ipad.setViewportSize({ width: 820, height: 1180 });
  await ipad.goto(`${BASE}/#/stoff?name=Essigs%C3%A4ure&smiles=CC(%3DO)O&formel=C2H4O2`, { waitUntil: 'networkidle' });
  await ipad.waitForSelector('.reaction-card', { timeout: 15000 });
  await ipad.screenshot({ path: `${out}/12-ipad.png`, fullPage: true });
  await ipad.close();
});

console.log(errors.length ? `\n⚠ ${errors.length} Konsolenfehler:` : '\n✓ Keine Konsolenfehler');
errors.slice(0, 8).forEach((e) => console.log('  -', e.slice(0, 200)));

await browser.close();
