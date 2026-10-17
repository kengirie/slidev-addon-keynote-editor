import { open, restore, diff, read, sleep } from './lib.mjs'
const dragPos = () => (read().split('---')[3] ?? '').match(/dragPos:\n((?:\s+.+\n)+)/)?.[1].trim() ?? '(なし)'
const slide2fm = () => read().split(/^---$/m)[3]
const t = await open(2)
const p = t.page
const fresh = async () => { await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500) }

// A 選んでいない枠の文字の上からドラッグ → 枠ごと移動
await t.drag(300, 380, 400, 430); console.log('A drag from text:', await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / '))
// B 矢印 1、Shift+矢印 10（URL が変わらないこと）
await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowRight'); await p.keyboard.press('Shift+ArrowDown'); await p.keyboard.press('Shift+ArrowDown'); await sleep(2500)
console.log('B arrows:', await t.box('body'), p.url(), '|', slide2fm().trim().replace(/\n/g, ' / '))
// C 選択内容にレイアウトを再適用（インスペクタのボタン）
await p.getByRole('button', { name: '選択内容にレイアウトを再適用' }).click(); await sleep(2500)
console.log('C reapply:', await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / ') || '(frontmatter 空)')
await fresh()
// D 右下ハンドルで -100,-50 / Shift / Option
for (const [label, mods] of [['free', []], ['shift', ['Shift']], ['alt', ['Alt']]]) {
  await t.click(900, 700)            // 本文の空き領域を選択
  await t.drag(1825, 985, 1725, 935, { mods }); console.log('D resize', label, await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / '))
  await fresh()
}
// E 右辺のハンドル
await t.click(900, 700); await t.drag(1825, 660, 1725, 660); console.log('E right edge:', await t.box('body'))
await fresh()
// F Delete → 非表示、チェックボックスで戻す
await t.click(900, 700); await p.keyboard.press('Delete'); await sleep(2500)
console.log('F delete:', await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / '))
await p.getByLabel('スライドの箇条書きテキスト').check(); await sleep(2500)
console.log('F show again:', await t.box('body'), '|', (slide2fm().trim() || '(frontmatter: layout のみ)').replace(/\n/g, ' / '))
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
