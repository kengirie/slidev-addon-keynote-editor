import { open, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
const sel = () => p.evaluate(() => { const s = window.getSelection(); return { collapsed: s.isCollapsed, text: s.toString() } })
const reset = async () => { await p.keyboard.press('Escape'); await sleep(300); await p.keyboard.press('Escape'); await sleep(2500) }
await t.dblclick(300, 140); console.log('A 選んでいないタイトルの文字をダブルクリック:', await t.state(), await sel()); await reset()
await t.click(300, 140); await t.dblclick(300, 140); console.log('B 選択済みのタイトルの文字をダブルクリック:', await t.state(), await sel()); await reset()
await t.dblclick(900, 700); console.log('C 本文の枠の空き領域をダブルクリック:', await t.state(), await sel()); await reset()
await t.dblclick(300, 220); console.log('D 空のサブタイトルをダブルクリック:', await t.state(), await sel()); await reset()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
