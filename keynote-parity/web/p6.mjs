import { open, restore, read, sleep } from './lib.mjs'
const t = await open(2)
await t.click(300, 220); await t.page.keyboard.type('Sub'); await t.page.keyboard.press('Escape'); await sleep(2500)
console.log(read().split('\n').slice(10, 32).map((l, i) => `${i + 11}: ${l}`).join('\n'))
await restore(); await t.browser.close()
