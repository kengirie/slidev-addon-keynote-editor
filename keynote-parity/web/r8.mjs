import { open, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
for (const wait of [0, 1000, 3000]) {
  await sleep(wait)
  console.log(wait, await p.evaluate(() => ({ attr: !!document.querySelector('#slide-content [data-slidev-no="2"] [data-studio-layout-boxes]'), checks: document.querySelectorAll('.studio-check').length, sel: !!window.__studio__.selection.value, panel: window.__studio__.activePanel.value, dock: document.querySelector('.studio-dock')?.innerText.slice(0, 80) })))
}
await t.browser.close()
