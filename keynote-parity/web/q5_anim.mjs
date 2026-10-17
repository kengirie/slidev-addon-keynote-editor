import { open, restore, read, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
await t.click(900, 700); await p.locator('button:has-text("Animate")').first().click(); await sleep(600)
await p.locator('.studio-dock select').first().selectOption('click'); await sleep(2500)
await p.keyboard.press('Escape'); await sleep(300); await t.click(900, 700); await p.locator('button:has-text("Animate")').first().click(); await sleep(600)
await p.locator('.studio-dock select').filter({ has: p.locator('option[value=stagger]') }).first().selectOption('stagger'); await sleep(2500)
console.log(read().split(/^---$/m)[4])
await t.browser.close()
// エディタを閉じて、クリックで 1 項目ずつ出るか
const u = await open(2, { editor: false })
const vis = () => u.page.evaluate(() => [...document.querySelectorAll('#slide-content [data-slidev-no="2"] [data-box="body"] li')].map(li => getComputedStyle(li).opacity))
console.log('clicks total:', await u.page.evaluate(() => document.querySelector('#slide-content [data-slidev-no="2"]') && window.__slidev__?.nav?.clicksTotal), 'step0:', await vis())
await u.page.keyboard.press('ArrowRight'); await sleep(600); console.log('step1:', await vis(), u.page.url())
await u.page.keyboard.press('ArrowRight'); await sleep(600); console.log('step2:', await vis(), u.page.url())
await u.browser.close()
await restore()
