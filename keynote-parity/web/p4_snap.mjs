import { open, restore, read, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
const fresh = async () => { await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500) }
// Keynote と同じ準備：本文を幅 800（x 95..895）に
async function prep800() { await fresh(); await t.click(900, 700); await t.drag(1825, 985, 895, 985); return t.box('body') }
for (const d of [0, 4, 8, 10, 14]) {
  const b = await prep800()
  await t.drag(300, 700, 300 + (960 + d - (b[0] + b[2] / 2)), 700, { steps: 30 })
  const nb = await t.box('body'); console.log(`center target ${960 + d}: x=${nb[0]} center=${nb[0] + nb[2] / 2}`)
}
// 端は吸着しない（左端をタイトルの左端 95 の 4pt 右へ）
let b = await prep800()
await t.drag(300, 700, 300 + (300 - b[0]), 700, { steps: 30 }); b = await t.box('body')
await t.drag(500, 700, 500 + (99 - b[0]), 700, { steps: 30 }); console.log('left edge to 99 (title left 95):', (await t.box('body'))[0])
// 移動直後の Shift 角リサイズ（Keynote: 1626×611）
await fresh(); await t.click(900, 700); await t.drag(1825, 985, 1725, 935, { mods: ['Shift'] }); console.log('shift corner:', await t.box('body'))
// ドラッグ中の位置表示とガイド
await fresh(); b = await t.box('body')
await t.click(900, 700); await t.drag(1825, 985, 895, 985); b = await t.box('body')
const [a1, a2] = await t.s(300, 700); const [c1, c2] = await t.s(300 + 465 + 3, 700)
await p.mouse.move(a1, a2); await p.mouse.down(); await p.mouse.move(c1, c2, { steps: 20 }); await sleep(300)
console.log('during drag:', await p.evaluate(() => ({ readout: document.querySelector('.studio-readout')?.textContent?.trim(), guides: [...document.querySelectorAll('.studio-guide')].map(g => getComputedStyle(g).backgroundColor + ' ' + g.style.width + 'x' + g.style.height) })))
await p.screenshot({ path: '/private/tmp/claude-501/-Users-3001macmini-slidev-keynote-template/056af4ff-ef94-458a-b2b4-37e2442d68af/scratchpad/ed-guides.png' })
await p.mouse.up(); await sleep(1500)
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
