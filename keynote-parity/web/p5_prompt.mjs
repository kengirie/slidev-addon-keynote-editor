import { open, restore, diff, read, sleep } from './lib.mjs'
const slide2fm = () => read().split(/^---$/m)[3]
const t = await open(2)
const p = t.page
// 空のサブタイトルをクリック → 枠が選ばれる → 文字を打つ → Esc
await t.click(300, 220); console.log('click empty subtitle:', await t.state())
await p.keyboard.type('Sub'); await sleep(300)
console.log('typing:', await t.state(), await p.evaluate(() => document.querySelector('.kbox-prompt')?.textContent))
await p.keyboard.press('Escape'); await sleep(2500)
console.log('md:\n' + diff())
console.log('subtitle now:', await p.evaluate(() => document.querySelector('#slide-content [data-slidev-no="2"] [data-box="subtitle"]')?.textContent?.trim()))
await restore(); await p.reload({ waitUntil: 'networkidle' }); await sleep(1500)
// Delete → 非表示 → チェックボックスで戻す
await t.click(900, 700); await p.keyboard.press('Delete'); await sleep(2500)
console.log('delete:', await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / '))
await p.getByLabel('スライドの箇条書きテキスト').check(); await sleep(2500)
console.log('show again:', await t.box('body'), '|', slide2fm().trim().replace(/\n/g, ' / '))
// ⌘Z で戻る（Delete の取り消し）
await restore()
console.log('errors', t.errors.filter(e => !/Wake Lock/.test(e)))
await t.browser.close()
