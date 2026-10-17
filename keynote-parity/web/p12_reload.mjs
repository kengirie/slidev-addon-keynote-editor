import { open, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
await p.evaluate(() => { window.__marker = 1; window.__remounts = 0; const el = document.querySelector('#slide-content [data-slidev-no="2"] [data-box="body"]'); window.__bodyEl = el })
await t.drag(300, 380, 400, 430)
await sleep(1500)
console.log(await p.evaluate(() => ({ pageReloaded: window.__marker !== 1, bodyElementReplaced: window.__bodyEl !== document.querySelector('#slide-content [data-slidev-no="2"] [data-box="body"]') })))
await t.browser.close()
