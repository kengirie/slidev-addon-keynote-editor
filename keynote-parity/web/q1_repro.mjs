import { open, diff, sleep } from './lib.mjs'
const t = await open(2)
const p = t.page
const show = async (label) => {
  const s = await t.state()
  const badge = await p.evaluate(() => [...document.querySelectorAll('.studio-badge')].map(b => b.textContent.trim()))
  const panel = await p.evaluate(() => document.querySelector('.studio-dock')?.innerText.split('\n').slice(0, 4).join(' | '))
  console.log(label, JSON.stringify(s), 'badge:', badge, 'panel:', panel)
}
await t.click(260, 380); await show('1 箇条書きをクリック:')
await t.click(260, 380); await show('2 もう一度クリック:')
await t.click(600, 455); await show('3 編集中に別の項目をクリック:')
await t.click(260, 380); await show('4 さらにクリック:')
await p.keyboard.press('Escape'); await sleep(300); await p.keyboard.press('Escape'); await sleep(300)
await t.click(1200, 1000); await show('5 枠の外（スライドの下の余白）をクリック:')
await t.click(260, 380); await show('6 箇条書きをクリック:')
// 編集を「外をクリック」で終えたあとにドラッグ
await t.click(260, 380); await t.click(1300, 220); await show('7 編集→空き領域クリック:')
await t.drag(260, 380, 360, 430); await show('8 その後ドラッグ:')
console.log('md:\n' + diff())
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
