import { open, restore, diff, read, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
const fresh = async () => { await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500) }
const badge = () => p.evaluate(() => [...document.querySelectorAll('.studio-badge')].map(b => b.textContent.trim()))
const panel = () => p.evaluate(() => document.querySelector('.studio-dock')?.innerText.replace(/\n+/g, ' | ').slice(0, 160))
const S = async l => console.log(l, JSON.stringify((await t.state()).sel), (await t.state()).editing ? 'editing' : '', 'badge', await badge())

console.log('=== 4 アニメーション（枠ごと）')
await t.click(900, 700); await p.locator('button:has-text("Animate")').first().click(); await sleep(600)
console.log('  panel:', await panel())
await p.locator('.studio-dock select').first().selectOption('click'); await sleep(2500)
console.log('  appear on click:', diff().trim().replace(/\n/g, ' | '))
await p.keyboard.press('Escape'); await sleep(300); await t.click(900, 700); await p.locator('button:has-text("Animate")').first().click(); await sleep(600)
const children = p.locator('.studio-dock select').filter({ has: p.locator('option[value=stagger]') })
console.log('  stagger offered:', await children.count())
if (await children.count()) { await children.first().selectOption('stagger'); await sleep(2500) }
console.log('  stagger:', diff().trim().replace(/\n/g, ' | '))
await S('  selection after animation:')
await fresh()

console.log('=== 5 部品の挿入（クリック）')
await p.locator('button:has-text("Components")').first().click(); await sleep(800)
const tile = p.locator('.studio-dock button, .studio-dock [role=button]').filter({ hasText: /Paragraph|Text|段落/ }).first()
console.log('  tile:', await tile.textContent().catch(() => null))
await tile.click(); await sleep(2500)
console.log('  md:', diff().trim().replace(/\n/g, ' | '))
console.log('  selection:', JSON.stringify((await t.state()).sel), 'in free layer:', await p.evaluate(() => !!window.__studio__.selection.value?.el.closest('.box-layout-free')))
await fresh()

console.log('=== 6 何もない所をクリック')
await t.click(1880, 300); console.log('  panel:', await panel())
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
