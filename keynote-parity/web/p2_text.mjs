import { open, restore, diff, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
const sel = () => p.evaluate(() => { const s = window.getSelection(); return { collapsed: s.isCollapsed, text: s.toString(), inTitle: !!document.activeElement?.closest?.('[data-box]')?.dataset.box, box: document.activeElement?.closest?.('[data-box]')?.dataset.box } })
// 1 選んでいない枠の文字をクリック → 枠が選ばれる
await t.click(300, 140); console.log('1 click unselected title:', await t.state())
// 2 もう 1 回クリック → 文字編集、クリック位置にカーソル
await t.click(300, 140); console.log('2 second click:', await t.state(), await sel())
// 3 ⌘Return → 枠の選択に戻る
await p.keyboard.press('Meta+Enter'); await sleep(600); console.log('3 cmd+return:', await t.state())
// 4 Esc → 選択なし
await p.keyboard.press('Escape'); await sleep(400); console.log('4 esc:', await t.state())
// 5 本文の文字をダブルクリック → 単語選択
await t.dblclick(260, 380); console.log('5 dblclick body:', await t.state(), await sel())
await p.keyboard.type('X'); await p.keyboard.press('Escape'); await sleep(2500)
console.log('5 after typing X + esc:', await t.state(), '\n' + diff())
await restore()
await t.page.reload({ waitUntil: 'networkidle' }); await sleep(1500)
// 6 枠を選んで文字を打つ → 中身が置き換わる
await t.click(300, 140); await p.keyboard.type('Y'); await sleep(500); console.log('6 typing with box selected:', await t.state(), await sel())
await p.keyboard.press('Escape'); await sleep(2500); console.log('6 md:\n' + diff())
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
