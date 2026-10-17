import { open, restore, diff, read, sleep } from './lib.mjs'
const fm = () => (read().split(/^---$/m)[3] ?? '').trim().replace(/\n/g, ' / ')
const t = await open(2)
const p = t.page
const fresh = async () => { await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500) }

console.log('B 移動 → ⌘Z / 移動 → 再適用（画面とファイル）')
await t.drag(900, 700, 1000, 750); console.log('  moved:', await t.box('body'), '|', fm())
await p.keyboard.press('Escape'); await p.keyboard.press('Meta+z'); await sleep(2500); console.log('  undo:', await t.box('body'), '|', fm())
await t.drag(900, 700, 1000, 750); await p.keyboard.press('Escape'); await sleep(300); await t.click(900, 700)
await p.getByRole('button', { name: '選択内容にレイアウトを再適用' }).click(); await sleep(2500); console.log('  reapply:', await t.box('body'), '|', fm())
await fresh()

console.log('A Markdown 表示で編集 → 別の枠をクリック')
await t.click(260, 380); await t.click(260, 380)
await p.locator('.studio-inline [title="Edit as Markdown"]').click(); await sleep(400)
await p.locator('.studio-inline textarea').fill('- 書き換えた本文'); await t.click(300, 140); await sleep(2500)
console.log('  md:', diff().trim().replace(/\n/g, ' | '))
await fresh()

console.log('G 編集中に別の枠を押してドラッグ')
await t.click(260, 380); await t.click(260, 380); await p.keyboard.type('Q')
await t.drag(300, 140, 400, 190); console.log('  sel:', JSON.stringify((await t.state()).sel), '| md:', diff().trim().replace(/\n/g, ' | '))
await fresh()

console.log('I チェックボックス', await p.evaluate(() => [...document.querySelectorAll('.studio-check')].map(l => l.textContent.trim())))
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
