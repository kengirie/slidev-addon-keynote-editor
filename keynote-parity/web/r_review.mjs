import { open, restore, diff, read, sleep } from './lib.mjs'
const fmOf = n => (read().split(/^---$/m)[2 * n - 1] ?? '').trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
const fresh = async (no = 2) => { await restore(); await p.goto(`${process.env.URL}/${no}`, { waitUntil: 'networkidle' }); await sleep(1500) }

console.log('R1 frontmatter の文字を編集中に別の所をクリック')
await p.evaluate(() => { const s = document.createElement('span'); s.textContent = 'PROP'; s.dataset.studioProp = 'note'; s.style.cssText = 'position:absolute;left:1500px;top:1000px;font-size:40px'; document.querySelector('#slide-content [data-slidev-no="2"] .box-layout-free').appendChild(s) })
await t.dblclick(1530, 1020); await p.keyboard.type('XYZ'); await t.click(300, 140); await sleep(2500)
console.log('  slide2 fm:', fmOf(2))
await fresh()

console.log('R2 矢印で動かしてすぐ次のスライドへ')
await t.click(900, 700); await p.keyboard.press('ArrowRight'); await p.keyboard.press('PageDown'); await sleep(1500)
console.log('  slide2:', fmOf(2), '| slide3:', fmOf(3))
await fresh()

console.log('R3/R6 動かした後に文字を編集（縮小の再計算）しても戻らない・z-index を残さない')
await t.drag(900, 700, 1000, 750)
console.log('  after move:', await t.box('body'), 'zIndex:', await p.evaluate(() => document.querySelector('#slide-content [data-slidev-no="2"] [data-box="body"]').style.zIndex || '(none)'))
await t.click(260, 380); await p.keyboard.press('End'); await p.keyboard.type('とても長い文字を足して縮小を起こすとても長い文字を足して縮小を起こす'); await sleep(800)
console.log('  while editing:', await t.box('body'))
await p.keyboard.press('Escape'); await sleep(2500)
console.log('  after edit:', await t.box('body'), '|', fmOf(2))
await fresh()

console.log('R5 画像の枠で文字を打つ・ダブルクリック')
await fresh(4)
const sh = async () => JSON.stringify(await t.state())
const n4 = 4
const [ix, iy] = await p.evaluate(() => { const r = document.querySelector('#slide-content [data-slidev-no="4"]').getBoundingClientRect(); const k = r.width / 1920; return [r.left + 1300 * k, r.top + 500 * k] })
await p.mouse.click(ix, iy); await sleep(400); console.log('  click image:', await sh())
await p.keyboard.type('a'); await sleep(400); console.log('  type:', await sh())
await p.mouse.dblclick(ix, iy); await sleep(400); console.log('  dblclick:', await sh())
await fresh()

console.log('R7 回転を残したまま X を変える / 幅を空にする')
await t.click(900, 700); await t.drag(1825, 985, 1700, 1060, { mods: ['Meta'] }); console.log('  rotated:', fmOf(2))
await p.keyboard.press('Escape'); await sleep(300); await t.click(900, 700)
const inputs = p.locator('.studio-dock input[type=number]')
await inputs.nth(0).fill('300'); await inputs.nth(0).dispatchEvent('change'); await sleep(1500); console.log('  X=300:', fmOf(2))
await inputs.nth(2).fill(''); await inputs.nth(2).dispatchEvent('change'); await sleep(1500); console.log('  width emptied:', fmOf(2), await t.box('body'))
await fresh()

console.log('R8 開いた直後のチェックボックス')
console.log('  labels:', await p.evaluate(() => [...document.querySelectorAll('.studio-check')].map(l => l.textContent.trim())))
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
