import { open, restore, read, sleep } from './lib.mjs'
const fmOf = n => (read().split(/^---$/m)[2 * n - 1] ?? '').trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
await t.click(900, 700); await p.keyboard.press('ArrowRight'); await p.keyboard.press('PageDown'); await sleep(1500)
console.log('slide2:', fmOf(2), '| slide3:', fmOf(3))
await restore(); await t.browser.close()
